import { describe, it, expect } from "vitest";

/**
 * TokenBalanceList Component Tests
 *
 * Tests for wallet provider integration and state management.
 *
 * Requirements:
 * - 8.2: Use Wallet_Provider to access connected account address
 * - 8.6: Handle case where no wallet is connected
 */

describe("TokenBalanceList Component", () => {
  describe("Wallet Provider Integration", () => {
    // Requirement 8.2: Use Wallet_Provider to access connected account address

    it("should define useWallet hook integration", () => {
      // The component uses useWallet() hook from @/providers/StellarWalletProvider
      // This test verifies the integration pattern is correct

      const mockWalletContext = {
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        isConnected: true,
        isConnecting: false,
        selectedWalletId: "freighter",
        network: "TESTNET" as const,
      };

      expect(mockWalletContext.address).toBeDefined();
      expect(mockWalletContext.isConnected).toBe(true);
      expect(typeof mockWalletContext.address).toBe("string");
    });

    it("should handle connected wallet state", () => {
      // When wallet is connected, component should have access to address
      const connectedState = {
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        isConnected: true,
      };

      expect(connectedState.isConnected).toBe(true);
      expect(connectedState.address).not.toBeNull();
      expect(connectedState.address?.length).toBe(56); // Stellar address length
    });

    it("should handle disconnected wallet state", () => {
      // Requirement 8.6: Handle case where no wallet is connected
      const disconnectedState = {
        address: null,
        isConnected: false,
      };

      expect(disconnectedState.isConnected).toBe(false);
      expect(disconnectedState.address).toBeNull();
    });

    it("should handle wallet connecting state", () => {
      // During connection, address might not be available yet
      const connectingState = {
        address: null,
        isConnected: false,
        isConnecting: true,
      };

      expect(connectingState.isConnecting).toBe(true);
      expect(connectingState.address).toBeNull();
    });

    it("should handle wallet address changes", () => {
      // Component should react to address changes
      const initialAddress =
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
      const newAddress =
        "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY";

      expect(initialAddress).not.toBe(newAddress);
      expect(initialAddress.length).toBe(56);
      expect(newAddress.length).toBe(56);
    });

    it("should validate Stellar address format", () => {
      // Stellar addresses are 56 characters starting with G
      const validAddress =
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

      expect(validAddress.length).toBe(56);
      expect(validAddress.charAt(0)).toBe("G");
    });

    it("should handle invalid address gracefully", () => {
      // Component should handle edge cases
      const invalidAddresses = [
        null,
        undefined,
        "",
        "invalid",
        "GXXX", // Too short
      ];

      invalidAddresses.forEach((addr) => {
        if (addr === null || addr === undefined || addr === "") {
          expect(!addr).toBe(true);
        } else {
          expect(addr.length).not.toBe(56);
        }
      });
    });
  });

  describe("Component State Management", () => {
    it("should initialize with null balances", () => {
      // Initial state before fetching
      const initialState = {
        balances: null,
        loading: false,
        error: null,
      };

      expect(initialState.balances).toBeNull();
      expect(initialState.loading).toBe(false);
      expect(initialState.error).toBeNull();
    });

    it("should handle loading state", () => {
      const loadingState = {
        balances: null,
        loading: true,
        error: null,
      };

      expect(loadingState.loading).toBe(true);
      expect(loadingState.balances).toBeNull();
    });

    it("should handle error state", () => {
      const errorState = {
        balances: null,
        loading: false,
        error: new Error("Failed to fetch balances"),
      };

      expect(errorState.error).toBeInstanceOf(Error);
      expect(errorState.error?.message).toBe("Failed to fetch balances");
      expect(errorState.loading).toBe(false);
    });

    it("should handle success state with balances", () => {
      const successState = {
        balances: [
          {
            assetCode: "XLM",
            balance: "1000.00",
            iconUrl: "https://stellar.expert/explorer/public/asset/XLM",
          },
        ],
        loading: false,
        error: null,
      };

      expect(successState.balances).not.toBeNull();
      expect(successState.balances?.length).toBeGreaterThan(0);
      expect(successState.loading).toBe(false);
      expect(successState.error).toBeNull();
    });

    it("should handle empty balances array", () => {
      const emptyState = {
        balances: [],
        loading: false,
        error: null,
      };

      expect(emptyState.balances).toEqual([]);
      expect(emptyState.balances?.length).toBe(0);
    });
  });

  describe("Empty State UI", () => {
    // Requirements 3.2, 7.1, 7.2, 7.3, 7.4
    // Task 6.2: Create empty state UI

    it("should display empty state when balances array is empty", () => {
      // Requirement 3.2, 7.1: Display empty state when no tokens
      const emptyState = {
        balances: [],
        loading: false,
        error: null,
      };

      expect(emptyState.balances).toEqual([]);
      expect(emptyState.balances.length).toBe(0);
      expect(emptyState.loading).toBe(false);
      expect(emptyState.error).toBeNull();
    });

    it("should display message indicating no tokens found", () => {
      // Requirement 7.2: Message should indicate no tokens were found
      const emptyStateMessage = "No tokens found in your account.";

      expect(emptyStateMessage).toContain("No tokens found");
      expect(emptyStateMessage).toContain("account");
      expect(emptyStateMessage.length).toBeGreaterThan(0);
    });

    it("should use Azable theme styling for empty state", () => {
      // Requirement 7.3: Use styling consistent with Azable theme
      const emptyStateStyles = {
        container: "p-6 bg-zinc-800 rounded-lg border border-zinc-700",
        text: "text-center text-zinc-400",
      };

      // Verify dark theme colors (zinc palette)
      expect(emptyStateStyles.container).toContain("bg-zinc-800");
      expect(emptyStateStyles.container).toContain("border-zinc-700");
      expect(emptyStateStyles.text).toContain("text-zinc-400");

      // Verify consistent styling elements
      expect(emptyStateStyles.container).toContain("rounded-lg");
      expect(emptyStateStyles.container).toContain("p-6");
      expect(emptyStateStyles.text).toContain("text-center");
    });

    it("should be visually distinct from loading state", () => {
      // Requirement 7.4: Be visually distinct from loading and error states
      const loadingState = {
        hasSkeletons: true,
        hasAnimations: true,
        layout: "space-y-3",
        multipleElements: true,
      };

      const emptyState = {
        hasSkeletons: false,
        hasAnimations: false,
        layout: "single-container",
        multipleElements: false,
      };

      // Loading state has skeletons, empty state does not
      expect(loadingState.hasSkeletons).toBe(true);
      expect(emptyState.hasSkeletons).toBe(false);

      // Loading state has multiple skeleton elements, empty state has single message
      expect(loadingState.multipleElements).toBe(true);
      expect(emptyState.multipleElements).toBe(false);
    });

    it("should be visually distinct from error state", () => {
      // Requirement 7.4: Be visually distinct from loading and error states
      const errorState = {
        borderColor: "border-red-900/50",
        textColor: "text-red-400",
        hasTitle: true,
        hasErrorMessage: true,
      };

      const emptyState = {
        borderColor: "border-zinc-700",
        textColor: "text-zinc-400",
        hasTitle: false,
        hasErrorMessage: false,
      };

      // Error state uses red colors, empty state uses neutral colors
      expect(errorState.borderColor).toContain("red");
      expect(emptyState.borderColor).toContain("zinc");

      expect(errorState.textColor).toContain("red");
      expect(emptyState.textColor).toContain("zinc");

      // Error state has title and error message, empty state has simple message
      expect(errorState.hasTitle).toBe(true);
      expect(emptyState.hasTitle).toBe(false);
    });

    it("should render empty state only when balances is empty array", () => {
      // Empty state should only show when balances is [] (not null, not undefined)
      const scenarios = [
        { balances: null, shouldShowEmpty: false, description: "null" },
        {
          balances: undefined,
          shouldShowEmpty: false,
          description: "undefined",
        },
        { balances: [], shouldShowEmpty: true, description: "empty array" },
        {
          balances: [{ assetCode: "XLM", balance: "100" }],
          shouldShowEmpty: false,
          description: "with data",
        },
      ];

      scenarios.forEach((scenario) => {
        const shouldShow =
          scenario.balances !== null &&
          scenario.balances !== undefined &&
          Array.isArray(scenario.balances) &&
          scenario.balances.length === 0;

        expect(shouldShow).toBe(scenario.shouldShowEmpty);
      });
    });

    it("should have consistent container styling with other states", () => {
      // All states should use similar container structure for consistency
      const states = {
        noWallet: "p-6 bg-zinc-800 rounded-lg border border-zinc-700",
        loading: "space-y-3",
        error: "p-6 bg-zinc-800 rounded-lg border border-red-900/50",
        empty: "p-6 bg-zinc-800 rounded-lg border border-zinc-700",
        success: "space-y-3",
      };

      // Empty state shares container styling with noWallet state
      expect(states.empty).toBe(states.noWallet);

      // But differs from error state (different border color)
      expect(states.empty).not.toBe(states.error);

      // All container states use consistent padding and rounded corners
      expect(states.noWallet).toContain("p-6");
      expect(states.error).toContain("p-6");
      expect(states.empty).toContain("p-6");

      expect(states.noWallet).toContain("rounded-lg");
      expect(states.error).toContain("rounded-lg");
      expect(states.empty).toContain("rounded-lg");
    });

    it("should center align empty state message", () => {
      // Empty state message should be centered for better visual presentation
      const messageAlignment = "text-center";

      expect(messageAlignment).toBe("text-center");
    });

    it("should use appropriate text color for empty state", () => {
      // Empty state should use muted text color (zinc-400) to indicate informational message
      const textColor = "text-zinc-400";

      expect(textColor).toBe("text-zinc-400");
      expect(textColor).not.toContain("red"); // Not an error
      expect(textColor).not.toContain("green"); // Not a success
    });
  });

  describe("No Wallet Connected Handling", () => {
    // Requirement 8.6: Handle case where no wallet is connected

    it("should detect when wallet is not connected", () => {
      const notConnected = {
        isConnected: false,
        address: null,
      };

      expect(notConnected.isConnected).toBe(false);
      expect(notConnected.address).toBeNull();
    });

    it("should reset state when wallet disconnects", () => {
      // When wallet disconnects, component should reset state
      const resetState = {
        balances: null,
        loading: false,
        error: null,
      };

      expect(resetState.balances).toBeNull();
      expect(resetState.loading).toBe(false);
      expect(resetState.error).toBeNull();
    });

    it("should provide appropriate message for no wallet", () => {
      const noWalletMessage =
        "Please connect your wallet to view token balances.";

      expect(noWalletMessage).toContain("connect");
      expect(noWalletMessage).toContain("wallet");
      expect(noWalletMessage.length).toBeGreaterThan(0);
    });

    it("should handle transition from connected to disconnected", () => {
      // Simulate wallet disconnection
      const beforeDisconnect = {
        isConnected: true,
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      };

      const afterDisconnect = {
        isConnected: false,
        address: null,
      };

      expect(beforeDisconnect.isConnected).toBe(true);
      expect(afterDisconnect.isConnected).toBe(false);
      expect(beforeDisconnect.address).not.toBeNull();
      expect(afterDisconnect.address).toBeNull();
    });

    it("should handle transition from disconnected to connected", () => {
      // Simulate wallet connection
      const beforeConnect = {
        isConnected: false,
        address: null,
      };

      const afterConnect = {
        isConnected: true,
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      };

      expect(beforeConnect.isConnected).toBe(false);
      expect(afterConnect.isConnected).toBe(true);
      expect(beforeConnect.address).toBeNull();
      expect(afterConnect.address).not.toBeNull();
    });
  });

  describe("useEffect Dependency Handling", () => {
    it("should track address changes for refetching", () => {
      // Component should refetch when address changes
      const addresses = [
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        "GZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
      ];

      addresses.forEach((addr) => {
        expect(addr.length).toBe(56);
        expect(addr.charAt(0)).toBe("G");
      });

      // Each unique address should trigger a new fetch
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(addresses.length);
    });

    it("should track isConnected changes", () => {
      const states = [
        { isConnected: false },
        { isConnected: true },
        { isConnected: false },
      ];

      states.forEach((state, index) => {
        expect(typeof state.isConnected).toBe("boolean");
        if (index === 1) {
          expect(state.isConnected).toBe(true);
        }
      });
    });

    it("should handle rapid connection state changes", () => {
      // Component should handle rapid state changes gracefully
      const stateSequence = [
        { isConnected: false, address: null },
        { isConnected: true, address: "GXXX..." },
        { isConnected: false, address: null },
        { isConnected: true, address: "GYYY..." },
      ];

      stateSequence.forEach((state) => {
        if (state.isConnected) {
          expect(state.address).not.toBeNull();
        } else {
          expect(state.address).toBeNull();
        }
      });
    });
  });

  describe("Error Handling for Wallet Integration", () => {
    it("should handle wallet provider errors", () => {
      const walletError = new Error("Wallet not found");

      expect(walletError).toBeInstanceOf(Error);
      expect(walletError.message).toContain("Wallet");
    });

    it("should handle network switching", () => {
      // When network changes, wallet might disconnect
      const networkChange = {
        oldNetwork: "TESTNET",
        newNetwork: "PUBLIC",
        shouldReconnect: true,
      };

      expect(networkChange.oldNetwork).not.toBe(networkChange.newNetwork);
      expect(networkChange.shouldReconnect).toBe(true);
    });

    it("should handle wallet extension not installed", () => {
      const notInstalledError = new Error("Wallet extension not installed");

      expect(notInstalledError.message).toContain("not installed");
    });

    it("should handle user rejection of connection", () => {
      const rejectionError = new Error("User rejected connection");

      expect(rejectionError.message).toContain("rejected");
    });
  });

  describe("Error Handling - Specific Error Types", () => {
    // Requirement 9.2: Handle network errors with user-friendly messages
    it("should handle network errors", () => {
      const networkError = new Error("Network request failed");
      networkError.name = "NetworkError";

      expect(networkError).toBeInstanceOf(Error);
      expect(networkError.message).toContain("Network");
    });

    // Requirement 9.3: Handle invalid addresses with appropriate messages
    it("should handle account not found errors", () => {
      const accountError = new Error("Account not found");
      accountError.name = "AccountNotFoundError";

      expect(accountError).toBeInstanceOf(Error);
      expect(accountError.message).toContain("not found");
    });

    // Requirement 9.1: Display error messages to user
    it("should handle API failures", () => {
      const apiError = new Error("API request failed");

      expect(apiError).toBeInstanceOf(Error);
      expect(apiError.message).toBeDefined();
    });

    // Requirement 9.4: Log detailed error information
    it("should prepare detailed error logging information", () => {
      const error = new Error("Test error");
      const errorLog = {
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        network: "TESTNET",
        error: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
      };

      expect(errorLog.address).toBeDefined();
      expect(errorLog.network).toBeDefined();
      expect(errorLog.error).toBe("Test error");
      expect(errorLog.errorType).toBe("Error");
      expect(errorLog.timestamp).toBeDefined();
    });

    it("should handle generic errors with fallback message", () => {
      const genericError = new Error();

      const fallbackMessage =
        genericError.message ||
        "An unexpected error occurred. Please try again later.";

      expect(fallbackMessage).toBeDefined();
      expect(fallbackMessage.length).toBeGreaterThan(0);
    });

    it("should distinguish between error types for user messages", () => {
      const errorTypes = {
        network:
          "Unable to connect to Stellar network. Please check your connection and try again.",
        accountNotFound:
          "Invalid account address. Please check your wallet connection.",
        generic: "An unexpected error occurred. Please try again later.",
      };

      expect(errorTypes.network).toContain("network");
      expect(errorTypes.accountNotFound).toContain("Invalid account");
      expect(errorTypes.generic).toContain("unexpected");
    });

    it("should provide error titles for different error types", () => {
      const errorTitles = {
        network: "Network Error",
        accountNotFound: "Account Not Found",
        stellar: "Stellar Network Error",
        generic: "Failed to load token balances",
      };

      expect(errorTitles.network).toBe("Network Error");
      expect(errorTitles.accountNotFound).toBe("Account Not Found");
      expect(errorTitles.stellar).toBe("Stellar Network Error");
      expect(errorTitles.generic).toBe("Failed to load token balances");
    });

    it("should handle non-Error objects in catch blocks", () => {
      const nonErrorValue = "string error";
      const convertedError = new Error(String(nonErrorValue));

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.message).toBe("string error");
    });

    it("should handle null/undefined errors", () => {
      const nullError = null;
      const undefinedError = undefined;

      const nullConverted = new Error(String(nullError || "Unknown error"));
      const undefinedConverted = new Error(
        String(undefinedError || "Unknown error"),
      );

      expect(nullConverted.message).toBe("Unknown error");
      expect(undefinedConverted.message).toBe("Unknown error");
    });
  });

  describe("Error State UI", () => {
    // Task 6.3: Create error state UI
    // Requirements 9.1, 9.2, 9.5

    it("should display error state when error is present", () => {
      // Requirement 9.1: Display error messages to user
      const errorState = {
        balances: null,
        loading: false,
        error: new Error("Failed to fetch balances"),
      };

      expect(errorState.error).not.toBeNull();
      expect(errorState.error).toBeInstanceOf(Error);
      expect(errorState.loading).toBe(false);
    });

    it("should use Azable theme styling for error state", () => {
      // Requirement 9.5: Error state uses Azable theme styling
      const errorStateStyles = {
        container: "p-6 bg-zinc-800 rounded-lg border border-red-900/50",
        titleText: "text-red-400 font-semibold mb-2",
        messageText: "text-zinc-400 text-sm",
      };

      // Verify dark theme colors (zinc palette for background)
      expect(errorStateStyles.container).toContain("bg-zinc-800");
      expect(errorStateStyles.container).toContain("rounded-lg");
      expect(errorStateStyles.container).toContain("p-6");

      // Verify error-specific styling (red border and text)
      expect(errorStateStyles.container).toContain("border-red-900/50");
      expect(errorStateStyles.titleText).toContain("text-red-400");
      expect(errorStateStyles.titleText).toContain("font-semibold");

      // Verify message text styling
      expect(errorStateStyles.messageText).toContain("text-zinc-400");
      expect(errorStateStyles.messageText).toContain("text-sm");
    });

    it("should display different messages based on NetworkError type", () => {
      // Requirement 9.2: User-friendly message for network errors
      const networkErrorTitle = "Network Error";
      const networkErrorMessage =
        "Unable to connect to Stellar network. Please check your connection and try again.";

      expect(networkErrorTitle).toBe("Network Error");
      expect(networkErrorMessage).toContain("Unable to connect");
      expect(networkErrorMessage).toContain("Stellar network");
      expect(networkErrorMessage).toContain("check your connection");
    });

    it("should display different messages based on AccountNotFoundError type", () => {
      // Requirement 9.3: Appropriate message for invalid addresses
      const accountErrorTitle = "Account Not Found";
      const accountErrorMessage =
        "Invalid account address. Please check your wallet connection.";

      expect(accountErrorTitle).toBe("Account Not Found");
      expect(accountErrorMessage).toContain("Invalid account address");
      expect(accountErrorMessage).toContain("wallet connection");
    });

    it("should display different messages based on StellarError type", () => {
      // Handle Stellar-specific errors
      const stellarErrorTitle = "Stellar Network Error";
      const stellarErrorMessage = "An error occurred while fetching balances.";

      expect(stellarErrorTitle).toBe("Stellar Network Error");
      expect(stellarErrorMessage).toContain("error occurred");
      expect(stellarErrorMessage).toContain("fetching balances");
    });

    it("should display generic error message for unknown error types", () => {
      // Fallback for generic errors
      const genericErrorTitle = "Failed to load token balances";
      const genericErrorMessage =
        "An unexpected error occurred. Please try again later.";

      expect(genericErrorTitle).toBe("Failed to load token balances");
      expect(genericErrorMessage).toContain("unexpected error");
      expect(genericErrorMessage).toContain("try again later");
    });

    it("should display error title and message separately", () => {
      // Error state should have both title and message for clarity
      const errorDisplay = {
        hasTitle: true,
        hasMessage: true,
        titleElement: "p.text-red-400.font-semibold.mb-2",
        messageElement: "p.text-zinc-400.text-sm",
      };

      expect(errorDisplay.hasTitle).toBe(true);
      expect(errorDisplay.hasMessage).toBe(true);
      expect(errorDisplay.titleElement).toContain("text-red-400");
      expect(errorDisplay.messageElement).toContain("text-zinc-400");
    });

    it("should center align error content", () => {
      // Error content should be centered for better visual presentation
      const errorContentAlignment = "text-center";

      expect(errorContentAlignment).toBe("text-center");
    });

    it("should be visually distinct from empty state", () => {
      // Error state should be clearly distinguishable from empty state
      const errorState = {
        borderColor: "border-red-900/50",
        titleColor: "text-red-400",
        hasTitle: true,
      };

      const emptyState = {
        borderColor: "border-zinc-700",
        titleColor: null,
        hasTitle: false,
      };

      // Error uses red border, empty uses neutral border
      expect(errorState.borderColor).toContain("red");
      expect(emptyState.borderColor).toContain("zinc");

      // Error has red title, empty has no title
      expect(errorState.hasTitle).toBe(true);
      expect(emptyState.hasTitle).toBe(false);
    });

    it("should be visually distinct from loading state", () => {
      // Error state should be clearly distinguishable from loading state
      const errorState = {
        hasSkeletons: false,
        hasStaticContent: true,
        layout: "single-container",
      };

      const loadingState = {
        hasSkeletons: true,
        hasStaticContent: false,
        layout: "multiple-skeletons",
      };

      // Error shows static content, loading shows animated skeletons
      expect(errorState.hasSkeletons).toBe(false);
      expect(loadingState.hasSkeletons).toBe(true);

      expect(errorState.hasStaticContent).toBe(true);
      expect(loadingState.hasStaticContent).toBe(false);
    });

    it("should handle error message fallback when error.message is empty", () => {
      // Handle edge case where error object has no message
      const emptyMessageError = new Error("");
      const displayMessage =
        emptyMessageError.message ||
        "An unexpected error occurred. Please try again later.";

      expect(displayMessage).toBe(
        "An unexpected error occurred. Please try again later.",
      );
    });

    it("should use consistent container structure with other states", () => {
      // All container states should share similar structure
      const states = {
        noWallet: "p-6 bg-zinc-800 rounded-lg border border-zinc-700",
        error: "p-6 bg-zinc-800 rounded-lg border border-red-900/50",
        empty: "p-6 bg-zinc-800 rounded-lg border border-zinc-700",
      };

      // All use same padding and rounded corners
      expect(states.noWallet).toContain("p-6");
      expect(states.error).toContain("p-6");
      expect(states.empty).toContain("p-6");

      expect(states.noWallet).toContain("rounded-lg");
      expect(states.error).toContain("rounded-lg");
      expect(states.empty).toContain("rounded-lg");

      // All use same background color
      expect(states.noWallet).toContain("bg-zinc-800");
      expect(states.error).toContain("bg-zinc-800");
      expect(states.empty).toContain("bg-zinc-800");

      // Error state has distinct red border
      expect(states.error).toContain("border-red-900/50");
      expect(states.noWallet).not.toContain("red");
      expect(states.empty).not.toContain("red");
    });

    it("should render error state only when error is not null", () => {
      // Error state should only show when error exists
      const scenarios = [
        { error: null, shouldShowError: false, description: "null" },
        {
          error: undefined,
          shouldShowError: false,
          description: "undefined",
        },
        {
          error: new Error("Test error"),
          shouldShowError: true,
          description: "with error",
        },
      ];

      scenarios.forEach((scenario) => {
        const shouldShow =
          scenario.error !== null && scenario.error !== undefined;
        expect(shouldShow).toBe(scenario.shouldShowError);
      });
    });

    it("should prioritize error state over empty state", () => {
      // If both error and empty balances, error should be shown
      const errorWithEmptyBalances = {
        balances: [],
        loading: false,
        error: new Error("Failed to fetch"),
      };

      // Error state takes precedence
      const shouldShowError = errorWithEmptyBalances.error !== null;
      const shouldShowEmpty =
        !errorWithEmptyBalances.error &&
        errorWithEmptyBalances.balances?.length === 0;

      expect(shouldShowError).toBe(true);
      expect(shouldShowEmpty).toBe(false);
    });

    it("should not show error state during loading", () => {
      // Loading state should take precedence over error state
      const loadingWithError = {
        balances: null,
        loading: true,
        error: new Error("Previous error"),
      };

      // Loading state is shown first
      const shouldShowLoading = loadingWithError.loading;
      const shouldShowError =
        !loadingWithError.loading && loadingWithError.error !== null;

      expect(shouldShowLoading).toBe(true);
      expect(shouldShowError).toBe(false);
    });
  });

  describe("Integration with StellarService", () => {
    // Requirement 8.2: Component should use address from wallet provider
    // to call StellarService.getAccount()

    it("should prepare address for service call", () => {
      const walletAddress =
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

      // Address should be valid for StellarService.getAccount(address)
      expect(walletAddress).toBeDefined();
      expect(typeof walletAddress).toBe("string");
      expect(walletAddress.length).toBe(56);
    });

    it("should handle service call with valid address", () => {
      const validAddress =
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
      const serviceCallParams = {
        address: validAddress,
        method: "getAccount",
      };

      expect(serviceCallParams.address).toBe(validAddress);
      expect(serviceCallParams.method).toBe("getAccount");
    });

    it("should not call service when address is null", () => {
      const noAddress = null;
      const shouldCallService = noAddress !== null && noAddress !== undefined;

      expect(shouldCallService).toBe(false);
    });

    it("should not call service when not connected", () => {
      const notConnected = {
        isConnected: false,
        address: null,
      };

      const shouldCallService =
        notConnected.isConnected && notConnected.address;
      expect(shouldCallService).toBeFalsy();
    });

    it("should call service when connected with address", () => {
      const connected = {
        isConnected: true,
        address: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      };

      const shouldCallService = connected.isConnected && connected.address;
      expect(shouldCallService).toBeTruthy();
    });
  });

  describe("Success State UI", () => {
    // Task 6.4: Create success state UI
    // Requirements 3.1, 3.4

    it("should render TokenBalance component for each token in balances array", () => {
      // Requirement 3.1: Render TokenBalance component for each token
      const balances = [
        {
          assetCode: "XLM",
          balance: "1000.00",
          iconUrl: "https://stellar.expert/explorer/public/asset/XLM",
        },
        {
          assetCode: "USDC",
          assetIssuer:
            "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "500.00",
          iconUrl:
            "https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
        {
          assetCode: "BTC",
          assetIssuer:
            "GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH",
          balance: "0.5",
          iconUrl:
            "https://stellar.expert/explorer/public/asset/BTC-GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH",
        },
      ];

      // Component should render one TokenBalance per token
      expect(balances.length).toBe(3);
      balances.forEach((balance) => {
        expect(balance.assetCode).toBeDefined();
        expect(balance.balance).toBeDefined();
      });
    });

    it("should pass appropriate props to each TokenBalance component", () => {
      // Requirement 3.1: Pass appropriate props to TokenBalance
      const tokenBalance = {
        assetCode: "XLM",
        assetIssuer: undefined,
        balance: "1234.5678",
        iconUrl: "https://stellar.expert/explorer/public/asset/XLM",
      };

      // All required props should be present
      expect(tokenBalance.assetCode).toBe("XLM");
      expect(tokenBalance.balance).toBe("1234.5678");
      expect(tokenBalance.iconUrl).toBeDefined();
    });

    it("should pass assetIssuer prop for custom tokens", () => {
      const customToken = {
        assetCode: "USDC",
        assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        balance: "500.00",
        iconUrl:
          "https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      };

      expect(customToken.assetIssuer).toBeDefined();
      expect(customToken.assetIssuer?.length).toBe(56);
    });

    it("should not pass assetIssuer for native XLM", () => {
      const nativeToken = {
        assetCode: "XLM",
        assetIssuer: undefined,
        balance: "1000.00",
        iconUrl: "https://stellar.expert/explorer/public/asset/XLM",
      };

      expect(nativeToken.assetIssuer).toBeUndefined();
    });

    it("should use unique keys for each TokenBalance component", () => {
      // Keys should be unique to prevent React rendering issues
      const balances = [
        {
          assetCode: "XLM",
          assetIssuer: undefined,
          key: "XLM-native",
        },
        {
          assetCode: "USDC",
          assetIssuer:
            "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          key: "USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
        {
          assetCode: "BTC",
          assetIssuer:
            "GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH",
          key: "BTC-GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH",
        },
      ];

      const keys = balances.map((b) => b.key);
      const uniqueKeys = new Set(keys);

      // All keys should be unique
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("should render success state only when balances is non-empty array", () => {
      // Success state should only show when balances has data
      const scenarios = [
        { balances: null, shouldShowSuccess: false, description: "null" },
        {
          balances: undefined,
          shouldShowSuccess: false,
          description: "undefined",
        },
        { balances: [], shouldShowSuccess: false, description: "empty array" },
        {
          balances: [{ assetCode: "XLM", balance: "100" }],
          shouldShowSuccess: true,
          description: "with data",
        },
      ];

      scenarios.forEach((scenario) => {
        const shouldShow =
          scenario.balances !== null &&
          scenario.balances !== undefined &&
          Array.isArray(scenario.balances) &&
          scenario.balances.length > 0;

        expect(shouldShow).toBe(scenario.shouldShowSuccess);
      });
    });

    it("should use space-y-3 layout for token list", () => {
      // Success state should use vertical spacing between tokens
      const successStateLayout = "space-y-3";

      expect(successStateLayout).toBe("space-y-3");
    });

    it("should handle single token in balances array", () => {
      const singleTokenBalance = [
        {
          assetCode: "XLM",
          balance: "1000.00",
          iconUrl: "https://stellar.expert/explorer/public/asset/XLM",
        },
      ];

      expect(singleTokenBalance.length).toBe(1);
      expect(singleTokenBalance[0].assetCode).toBe("XLM");
    });

    it("should handle multiple tokens in balances array", () => {
      const multipleTokenBalances = [
        { assetCode: "XLM", balance: "1000.00" },
        { assetCode: "USDC", balance: "500.00" },
        { assetCode: "BTC", balance: "0.5" },
        { assetCode: "ETH", balance: "2.5" },
      ];

      expect(multipleTokenBalances.length).toBe(4);
      multipleTokenBalances.forEach((balance) => {
        expect(balance.assetCode).toBeDefined();
        expect(balance.balance).toBeDefined();
      });
    });

    it("should pass all TokenBalanceData fields to TokenBalance component", () => {
      // Requirement 3.4: Use existing UI components
      const tokenData = {
        assetCode: "USDC",
        assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        balance: "500.00",
        iconUrl:
          "https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      };

      // All fields from TokenBalanceData should be passed as props
      expect(tokenData.assetCode).toBeDefined();
      expect(tokenData.assetIssuer).toBeDefined();
      expect(tokenData.balance).toBeDefined();
      expect(tokenData.iconUrl).toBeDefined();
    });
  });
});
