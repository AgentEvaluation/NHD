import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { QaAgent } from '@/services/agents/claude/qaAgent';
import { TestMessage, TestRun } from '@/types/runs';
import { ChatMessage, TestChat } from '@/types/chat';
import { Rule } from '@/services/agents/claude/types';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const testRuns = await dbService.getTestRuns(userId);
    return NextResponse.json(testRuns);
  } catch (error: any) {
    console.error('Error fetching test runs:', error);
    return NextResponse.json({ error: 'Failed to fetch test runs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const testId = body.testId;
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    
    const apiKey = request.headers.get("x-api-key");
    const modelFromHeader = request.headers.get("x-model") || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key is missing on the server.' },
        { status: 500 }
      );
    }
    
    // Get user profile to ensure they have access to this test
    const profile = await dbService.getProfileByClerkId(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Fetch test configuration and related data
    const testConfig = await dbService.getAgentConfigAll(testId);
    if (!testConfig) {
      return NextResponse.json({ error: 'Test configuration not found' }, { status: 404 });
    }
    if (testConfig.org_id !== profile.org_id) {
      return NextResponse.json({ error: 'Unauthorized access to test' }, { status: 403 });
    }
    
    const personaMapping = await dbService.getPersonaMappingByAgentId(testId);
    const testVariations = await dbService.getTestVariations(testId);
    
    const scenarios = testVariations.testCases;
    const selectedPersonas = personaMapping.personaIds || [];
    const totalRuns = scenarios.length * selectedPersonas.length;
    
    // Create a test run record (for logging/saving purposes)
    const testRun: TestRun = {
      id: uuidv4(),
      name: testConfig.name,
      timestamp: new Date().toISOString(),
      status: 'running',
      metrics: {
        total: totalRuns,
        passed: 0,
        failed: 0,
        chats: totalRuns,
        correct: 0,
        incorrect: 0
      },
      chats: [],
      results: [],
      agentId: testId,
      createdBy: profile.id
    };

    await dbService.createTestRun(testRun);
    const completedChats: TestChat[] = [];
    
    // Format rules and input format
    const formattedRules: Rule[] = testConfig.rules.map(rule => ({
      id: uuidv4(),
      path: rule.path,
      condition: rule.condition,
      value: rule.value,
      description: rule.description || "",
      isValid: true
    }));
    const inputFormat: Record<string, any> = 
      typeof testConfig.inputFormat === 'object' ? 
      testConfig.inputFormat as Record<string, any> : {};
    
    // Create an SSE stream to send conversation events as they occur.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const encoder = new TextEncoder();

        const safeEnqueue = (data: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error("Enqueue failed:", e);
          }
        };

        const runCreatedEvent = `data: ${JSON.stringify({
          type: "run_created",
          runId: testRun.id,
          name: testRun.name,
          agentId: testRun.agentId,
          createdBy: testRun.createdBy
        })}\n\n`;
        controller.enqueue(encoder.encode(runCreatedEvent));

        
        for (const scenario of scenarios) {
          for (const personaId of selectedPersonas) {
            const chatId = uuidv4(); 
            let chatMessages: TestMessage[] = [];
            console.log(personaId);
            console.log(scenario);
            console.log("done with above");
            try {
              const agent = new QaAgent({
                headers: testConfig.headers,
                modelId: modelFromHeader,
                endpointUrl: testConfig.endpoint,
                apiConfig: {
                  inputFormat: inputFormat,
                  outputFormat: typeof testConfig.latestOutput?.responseData === 'object'
                    ? testConfig.latestOutput.responseData as Record<string, any>
                    : {},
                  rules: formattedRules
                },
                persona: personaId,
                userApiKey: apiKey
              });
              
              await agent.runTestStreaming(
                scenario.scenario,
                scenario.expectedOutput,
                (message) => {
                  const sseData = `data: ${JSON.stringify({
                    type: "message",
                    personaId,
                    message
                  })}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                  chatMessages.push(message);
                }
              );

              // After a chat finishes (inside the inner loop), send a chat_complete event.
              const chatCompleteEvent = `data: ${JSON.stringify({
                type: "chat_complete",
                chatId,
                success: true  // or false if an error occurred
              })}\n\n`;
              controller.enqueue(encoder.encode(chatCompleteEvent));

              const testChat: TestChat = {
                id: chatId,
                name: scenario.scenario,
                scenario: scenario.scenario,
                status: 'passed',
                messages: chatMessages.map(msg => ({ ...msg, chatId })),
                metrics: {
                  correct: 0,
                  incorrect: 0,
                  responseTime: [],
                  validationScores: [],
                  contextRelevance: []
                },
                timestamp: new Date().toISOString(),
                personaId
              };

              completedChats.push(testChat);
              
            } catch (error: any) {
              console.error('Error in test execution:', error);
              const sseData = `data: ${JSON.stringify({ personaId, error: error.message || "Unknown error occurred" })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }
        }
        // Optionally, save the test run record to the database
        testRun.chats = completedChats;
        testRun.status = 'completed';
        await dbService.updateTestRun(testRun);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "complete", testId })}\n\n`)
        );        
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Transfer-Encoding": "chunked"
      }
    });
  } catch (error: any) {
    console.error('Error executing test:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during test execution' },
      { status: 500 }
    );
  }
}
