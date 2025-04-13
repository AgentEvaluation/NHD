import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { QaAgentConfig, TestResult } from './types';
import { ApiHandler } from './apiHandler';
import { ConversationHandler } from './conversationHandler';
import { ResponseValidator } from './validators';
import { TestMessage } from "@/types/runs";
import { v4 as uuidv4 } from 'uuid';
import { ModelFactory } from "@/services/llm/modelfactory";
import { AnthropicModel } from "@/services/llm/enums";
import { SYSTEM_PROMPTS } from "@/services/prompts";
import { dbService } from "@/services/db";

export class QaAgent {
  private model;
  private memory: BufferMemory;
  private config: QaAgentConfig;
  private prompt: ChatPromptTemplate;

  constructor(config: QaAgentConfig) {
    this.config = config;
  
    const apiKey = config.userApiKey || "";
    if (!apiKey) {
      throw new Error("Anthropic API key not provided to QaAgent.");
    }

    this.model = ModelFactory.createLangchainModel(
      config.modelId || AnthropicModel.Sonnet3_5,
      apiKey
    );
    
    // Initialize BufferMemory to track conversation context automatically
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
    });

    // Initial prompt setup (persona not integrated here yet)
    this.prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPTS.API_TESTER()],
      ["human", "{input}"]
    ]);
  }

  async runTest(scenario: string, expectedOutput: string): Promise<TestResult> {
    try {
      // Retrieve persona prompt if applicable
      let personaSystemPrompt;
      if (this.config.persona) {
        try {
          const persona = await dbService.getPersonaById(this.config.persona);
          if (persona && persona.system_prompt) {
            personaSystemPrompt = persona.system_prompt;
          }
        } catch (error) {
          console.error('Error fetching persona:', error);
        }
      }
      
      // Update prompt using persona if provided
      this.prompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPTS.API_TESTER(personaSystemPrompt)],
        ["human", "{input}"]
      ]);

      // Build the chain: prompt -> model -> output parser
      const chain = RunnableSequence.from([
        this.prompt,
        this.model,
        new StringOutputParser()
      ]);

      // Clear any previous memory context
      await this.memory.clear();

      const planInput = `Test this scenario: ${scenario}
        Expected behavior: ${expectedOutput}

        ROLE: You are a REAL HUMAN USER sending messages to an AI assistant. NOT a tester.

        TASK:
        1. Understand what real-life situation this scenario represents
        2. Craft ONE natural opening message exactly as a regular person would write it
        3. Continue the conversation naturally for 3-5 turns based on the assistant's actual responses
        4. Conclude the conversation appropriately with one of these endings:
          - Express satisfaction and thank the assistant
          - Indicate you'll think about it and get back later
          - Politely express that you're not interested
          - Ask to save the information for future reference

        KEY REQUIREMENTS:
        - Your messages must be completely authentic - as a real person would actually type
        - Use natural language with typical human imperfections (casual tone, brief wording)
        - Include NO meta-commentary, explanations, or references to this being a test
        - Respond directly to what the assistant just said in each turn
        - Stay in character as a realistic user throughout the entire conversation
        - Keep each response focused on a single turn
        - Ensure the conversation has a natural progression and conclusion

        Your TEST_MESSAGE should read as if copied directly from a real customer conversation.

        TEST_MESSAGE:`;

      const planResult = await chain.invoke({ input: planInput });
      const initialTestMessage = ConversationHandler.extractTestMessage(planResult);
      const conversationPlan = ConversationHandler.extractConversationPlan(planResult);
      
      // We'll keep a custom log alongside memory for additional metrics/validation
      const allMessages: TestMessage[] = [];
      let totalResponseTime = 0;

      // Process the initial API call
      const formattedInput = ApiHandler.formatInput(initialTestMessage, this.config.apiConfig.inputFormat);
      let startTime = Date.now();
      let apiResponse = await ApiHandler.callEndpoint(
        this.config.endpointUrl, 
        this.config.headers, 
        formattedInput
      );
      let chatResponse = apiResponse?.response?.text || ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
      const initialResponseTime = Date.now() - startTime;
      totalResponseTime += initialResponseTime;

      // Save initial turn to BufferMemory
      await this.memory.saveContext(
        { input: initialTestMessage },
        { output: chatResponse }
      );

      const chatId = uuidv4();
      allMessages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'user',
        content: initialTestMessage,
        metrics: { responseTime: initialResponseTime, validationScore: 1 }
      });
      allMessages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: chatResponse,
        metrics: { responseTime: initialResponseTime, validationScore: 1 }
      });

      // Process multi-turn conversation if a plan exists
      if (conversationPlan && conversationPlan.length > 0) {
        const multiTurnResult = await this.processMultiTurnConversation(conversationPlan, chatResponse, chatId, chain);
        totalResponseTime += multiTurnResult.totalResponseTime;
        allMessages.push(...multiTurnResult.messages);
        chatResponse = multiTurnResult.finalResponse;
      }

      // Validate response format and scenario fulfillment
      const formatValid = ResponseValidator.validateResponseFormat(apiResponse, this.config.apiConfig.outputFormat);
      const conditionMet = ResponseValidator.validateCondition(apiResponse, this.config.apiConfig.rules);

      const memoryVariables = await this.memory.loadMemoryVariables({});
      const fullConversation = memoryVariables.chat_history;

      const conversationValidation = await this.validateFullConversation(
        fullConversation,
        scenario,
        expectedOutput
      );

      // Mark the final message with validation results
      const validatedMessages = allMessages.map(msg => ({
        ...msg,
        isCorrect: msg.id === allMessages[allMessages.length - 1].id ? 
          conversationValidation.isCorrect : 
          true,
        explanation: msg.id === allMessages[allMessages.length - 1].id ? 
          conversationValidation.explanation : 
          undefined
      }));

      return {
        conversation: {
          humanMessage: initialTestMessage,
          rawInput: formattedInput,
          rawOutput: apiResponse,
          chatResponse,
          allMessages: validatedMessages
        },
        validation: {
          passedTest: formatValid && conditionMet && conversationValidation.isCorrect,
          formatValid,
          conditionMet,
          explanation: conversationValidation.explanation,
          conversationResult: conversationValidation,
          metrics: { responseTime: totalResponseTime }
        }
      };
    } catch (error) {
      console.error('Error in runTest:', error);
      throw error;
    }
  }

  /**
   * Process multi-turn conversation by leveraging both BufferMemory and custom logging.
   * Each turn loads the current memory context, generates a follow-up prompt, calls the API,
   * and then saves the turn to memory.
   */
  private async processMultiTurnConversation(
    conversationPlan: string[],
    initialResponse: string,
    chatId: string,
    chain: RunnableSequence
  ): Promise<{ messages: TestMessage[], finalResponse: string, totalResponseTime: number }> {
    const messages: TestMessage[] = [];
    let currentResponse = initialResponse;
    let totalResponseTime = 0;

    for (const plannedTurn of conversationPlan) {
      // Load conversation context from BufferMemory
      const memoryVariables = await this.memory.loadMemoryVariables({});
      // The memory is stored under the key "chat_history" (as set in the constructor)
      const chatHistory = memoryVariables.chat_history;
      
      const followUpInputText = `Chat History: ${chatHistory}\n\nPrevious API response: "${currentResponse}"\n\nGiven this response and your plan: "${plannedTurn}"\n\nContinue the conversation naturally.`;
      const followUpResult = await chain.invoke({ input: followUpInputText });
      const followUpMessage = ConversationHandler.extractTestMessage(followUpResult);
      
      const formattedFollowUpInput = ApiHandler.formatInput(followUpMessage, this.config.apiConfig.inputFormat);

      const startTime = Date.now();
      let apiResponse;
      try {
        apiResponse = await ApiHandler.callEndpoint(
          this.config.endpointUrl,
          this.config.headers,
          formattedFollowUpInput,
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('API request timed out after 10 seconds');
        }
        throw error;
      }
      currentResponse = apiResponse?.response?.text || ConversationHandler.extractChatResponse(apiResponse, this.config.apiConfig.rules);
      const turnResponseTime = Date.now() - startTime;
      totalResponseTime += turnResponseTime;

      // Save this turn into BufferMemory for context in subsequent turns
      await this.memory.saveContext(
        { input: followUpMessage },
        { output: currentResponse }
      );

      // Log turn details in our custom array as well
      messages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'user',
        content: followUpMessage,
        metrics: { responseTime: turnResponseTime, validationScore: 1 }
      });
      messages.push({
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: currentResponse,
        metrics: { responseTime: turnResponseTime, validationScore: 1 }
      });
    }

    return { messages, finalResponse: currentResponse, totalResponseTime };
  }
  
  public async validateFullConversation(
    fullConversation: string,
    scenario: string,
    expectedOutput: string
  ) {
    // Provide a strict instruction:
    const promptText = `You are a precise and strict evaluator tasked with determining if a conversation met specific requirements. Return ONLY valid JSON.

    Test Scenario: ${scenario}
    Expected Output: ${expectedOutput}
    Complete Conversation:
    ${fullConversation}

    Evaluation Instructions:
    1. Analyze if the assistant's responses collectively satisfy the Expected Output requirements
    2. Focus on semantic meaning and intent fulfillment, not exact wording
    3. Consider if all key information or actions requested in Expected Output were addressed
    4. For failures, provide specific missing elements or contradictions

    Return JSON in this EXACT format:
    {"isCorrect": true or false, "explanation": "Your detailed reasoning explaining the specific elements that were met or missed"}

    Do NOT include any text outside the braces. Do NOT include code fences.`
  
    const result = await this.model.invoke([{ role: 'user', content: promptText }]);
  
    const content = typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result.content);
  
    // Parse or fail gracefully
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Model did not return valid JSON:", error);
      return {
        isCorrect: false,
        explanation: "Model returned invalid JSON. Prompt the user again or provide fallback."
      };
    }
  }
  
}
