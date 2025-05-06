"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import ApiKeyConfig from "@/components/config/ApiKeyConfig";
import { useState } from "react";
import { KeyRound, ToggleLeft, ToggleRight } from "lucide-react";
// import ThemeToggleButton from "../ui/theme-toggle-button";

export default function CustomUserDropdown() {
  const { theme, setTheme } = useTheme();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action
            label="API Keys Config"
            labelIcon={<KeyRound className="h-4 w-4" />}
            onClick={() => setIsApiKeyModalOpen(true)}
          />
          <UserButton.Action
            label="Dark Theme"
            labelIcon={
              theme === "dark" ? (
                <ToggleRight className="h-8 w-8 -mt-2 -ml-2 stroke-1" />
              ) : (
                <ToggleLeft className="h-8 w-8 -mt-2 -ml-2 stroke-1" />
              )
            }
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          />
        </UserButton.MenuItems>
      </UserButton>

      {/* API Key Config Modal */}
      <ApiKeyConfig
        isOpen={isApiKeyModalOpen}
        setIsOpen={setIsApiKeyModalOpen}
      />
    </>
  );
}
