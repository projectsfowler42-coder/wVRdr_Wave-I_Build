package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/projectsfowler42-coder/wVRdr_Wave-I_Build/tools/wvrdr-cli/execution"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "validate":
			if err := validateTruthSpine("."); err != nil {
				fmt.Fprintf(os.Stderr, "Truth Audit: FAIL: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("Truth Audit: PASS")
			return
		case "simulate-ladder":
			runSimulateLadder()
			return
		}
	}

	fmt.Println("wvrdr: Marshall CLI ready")
}

func runSimulateLadder() {
	if err := execution.VerifyLiveSafety(); err != nil {
		fmt.Println(err)
		return
	}

	ladder := execution.GenerateLadder("BKLN", "BUY", 999, 21.05)
	fmt.Println("[SHADOW_INTENT] IBKR Limit Ladder Preview:")
	for i, order := range ladder {
		fmt.Printf(" Rung %d: %s %d shares of %s at $%.2f\n", i+1, order.Action, order.Quantity, order.Ticker, order.Price)
	}
	fmt.Println("[STATUS] No orders transmitted. Execution locked to SHADOW.")
}

func validateTruthSpine(root string) error {
	violations := make([]string, 0)

	err := filepath.Walk(root, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.IsDir() {
			name := info.Name()
			if name == ".git" || name == "node_modules" || name == "dist" || name == "build" {
				return filepath.SkipDir
			}
			return nil
		}

		ext := filepath.Ext(path)
		if ext != ".ts" && ext != ".kt" {
			return nil
		}

		bytes, readErr := os.ReadFile(path)
		if readErr != nil {
			return readErr
		}

		content := strings.ToLower(string(bytes))
		hasLiveTruth := strings.Contains(content, "truthclass.live") ||
			strings.Contains(content, "truthclass: 'live'") ||
			strings.Contains(content, "truthclass: \"live\"") ||
			strings.Contains(content, "truthclass = truthclass.live") ||
			strings.Contains(content, "truthclass.live")
		hasFakeSource := strings.Contains(content, "mock") || strings.Contains(content, "sim")

		if hasLiveTruth && hasFakeSource {
			violations = append(violations, path)
		}

		return nil
	})
	if err != nil {
		return err
	}
	if len(violations) > 0 {
		return fmt.Errorf("fake confidence detected in %s", strings.Join(violations, ", "))
	}
	return nil
}
