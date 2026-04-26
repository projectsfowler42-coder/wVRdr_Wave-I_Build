package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/projectsfowler42-coder/wVRdr_Wave-I_Build/tools/wvrdr-cli/execution"
)

const defaultCaptureHistoryPath = "wavei_war_room_capture_history_v1.json"

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
		case "inspect-captures":
			runInspectCaptures(os.Args[2:])
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

func runInspectCaptures(args []string) {
	path := resolveCaptureHistoryPath(args)
	fmt.Println("[MARSHALL] Querying local capture_history_v1...")
	fmt.Printf("[MARSHALL] Source: %s\n", path)

	captures, err := loadCaptureHistory(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[FAILED] %v\n", err)
		os.Exit(1)
	}

	violations := auditCaptureHistory(captures)
	if len(violations) > 0 {
		fmt.Fprintln(os.Stderr, "[FAILED] Capture audit rejected by Truth Spine:")
		for _, violation := range violations {
			fmt.Fprintf(os.Stderr, " - %s\n", violation)
		}
		os.Exit(1)
	}

	fmt.Printf("[SUCCESS] %d Recent Captures Detected. All Truth Spine badges valid.\n", len(captures))
}

func resolveCaptureHistoryPath(args []string) string {
	for _, arg := range args {
		if strings.HasPrefix(arg, "--path=") {
			path := strings.TrimSpace(strings.TrimPrefix(arg, "--path="))
			if path != "" {
				return path
			}
		}
		if !strings.HasPrefix(arg, "-") && strings.TrimSpace(arg) != "" {
			return arg
		}
	}
	if envPath := strings.TrimSpace(os.Getenv("WAVEI_CAPTURE_HISTORY_PATH")); envPath != "" {
		return envPath
	}
	return defaultCaptureHistoryPath
}

func loadCaptureHistory(path string) ([]map[string]any, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("capture history file unavailable: %w", err)
	}

	var history []map[string]any
	if err := json.Unmarshal(bytes, &history); err == nil {
		return history, nil
	}

	var wrapped struct {
		History []map[string]any `json:"history"`
		Captures []map[string]any `json:"captures"`
	}
	if err := json.Unmarshal(bytes, &wrapped); err == nil {
		if len(wrapped.History) > 0 {
			return wrapped.History, nil
		}
		if len(wrapped.Captures) > 0 {
			return wrapped.Captures, nil
		}
	}

	var single map[string]any
	if err := json.Unmarshal(bytes, &single); err == nil {
		return []map[string]any{single}, nil
	}

	return nil, fmt.Errorf("capture history is not valid JSON capture data")
}

func auditCaptureHistory(captures []map[string]any) []string {
	violations := make([]string, 0)
	if len(captures) == 0 {
		return append(violations, "capture history is empty")
	}

	for index, capture := range captures {
		prefix := fmt.Sprintf("capture[%d]", index)
		if value, _ := capture["schema"].(string); value != "wavei.war_room.capture.v1" {
			violations = append(violations, fmt.Sprintf("%s schema mismatch", prefix))
		}
		if value, _ := capture["capturedAt"].(string); strings.TrimSpace(value) == "" {
			violations = append(violations, fmt.Sprintf("%s missing capturedAt", prefix))
		}
		if value, _ := capture["bridgeStatus"].(string); value != "DB_READY_LOCAL_ONLY" && value != "CAPTURE_FAILED" {
			violations = append(violations, fmt.Sprintf("%s invalid bridgeStatus", prefix))
		}

		statuses, ok := capture["refreshStatuses"].([]any)
		if !ok {
			violations = append(violations, fmt.Sprintf("%s missing refreshStatuses array", prefix))
			continue
		}
		for statusIndex, rawStatus := range statuses {
			status, ok := rawStatus.(map[string]any)
			if !ok {
				violations = append(violations, fmt.Sprintf("%s.refreshStatuses[%d] is not an object", prefix, statusIndex))
				continue
			}
			truthClass, _ := status["truthClass"].(string)
			connectionStatus, _ := status["connectionStatus"].(string)
			if strings.TrimSpace(truthClass) == "" {
				violations = append(violations, fmt.Sprintf("%s.refreshStatuses[%d] missing truthClass", prefix, statusIndex))
			}
			if strings.TrimSpace(connectionStatus) == "" {
				violations = append(violations, fmt.Sprintf("%s.refreshStatuses[%d] missing connectionStatus", prefix, statusIndex))
			}
			if strings.EqualFold(connectionStatus, "LIVE") && statusHasFakeSource(status) {
				violations = append(violations, fmt.Sprintf("%s.refreshStatuses[%d] has LIVE connectionStatus with mock/sim source indicators", prefix, statusIndex))
			}
		}
	}
	return violations
}

func statusHasFakeSource(status map[string]any) bool {
	for _, key := range []string{"source", "reason", "symbol"} {
		value, _ := status[key].(string)
		lower := strings.ToLower(value)
		if strings.Contains(lower, "mock") || strings.Contains(lower, "sim") {
			return true
		}
	}
	return false
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
