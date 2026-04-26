package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/projectsfowler42-coder/wVRdr_Wave-I_Build/tools/wvrdr-cli/execution"
)

const defaultCaptureHistoryPath = "wavei_war_room_capture_history_v1.json"

var fakeSourcePattern = regexp.MustCompile(`(?i)(^|[^a-z0-9])(mock|sim)([^a-z0-9]|$)`)

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

	count, violations, err := auditCaptureFile(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[FAILED] %v\n", err)
		os.Exit(1)
	}
	if len(violations) > 0 {
		fmt.Fprintln(os.Stderr, "[FAILED] Capture audit rejected by Truth Spine:")
		for _, violation := range violations {
			fmt.Fprintf(os.Stderr, " - %s\n", violation)
		}
		os.Exit(1)
	}

	fmt.Printf("[SUCCESS] %d Recent Captures Detected. All Truth Spine badges valid.\n", count)
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

func auditCaptureFile(path string) (int, []string, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, nil, fmt.Errorf("capture history file unavailable: %w", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	first, err := decoder.Token()
	if err != nil {
		return 0, nil, fmt.Errorf("capture history is not valid JSON capture data: %w", err)
	}

	count := 0
	violations := make([]string, 0)

	switch token := first.(type) {
	case json.Delim:
		switch token {
		case '[':
			for decoder.More() {
				var capture map[string]any
				if err := decoder.Decode(&capture); err != nil {
					return count, violations, fmt.Errorf("capture[%d] decode failed: %w", count, err)
				}
				violations = append(violations, auditCapture(capture, count)...)
				count++
			}
			_, _ = decoder.Token()
		case '{':
			objectCount, objectViolations, objectErr := auditWrappedCaptureObject(decoder)
			count += objectCount
			violations = append(violations, objectViolations...)
			if objectErr != nil {
				return count, violations, objectErr
			}
		default:
			return 0, nil, fmt.Errorf("capture history root must be array or object")
		}
	default:
		return 0, nil, fmt.Errorf("capture history root must be array or object")
	}

	if count == 0 {
		violations = append(violations, "capture history is empty")
	}
	return count, violations, nil
}

func auditWrappedCaptureObject(decoder *json.Decoder) (int, []string, error) {
	count := 0
	violations := make([]string, 0)
	for decoder.More() {
		keyToken, err := decoder.Token()
		if err != nil {
			return count, violations, err
		}
		key, _ := keyToken.(string)
		if key != "history" && key != "captures" {
			var discard any
			if err := decoder.Decode(&discard); err != nil {
				return count, violations, err
			}
			continue
		}

		arrayToken, err := decoder.Token()
		if err != nil {
			return count, violations, err
		}
		if delim, ok := arrayToken.(json.Delim); !ok || delim != '[' {
			return count, violations, fmt.Errorf("%s must be an array", key)
		}
		for decoder.More() {
			var capture map[string]any
			if err := decoder.Decode(&capture); err != nil {
				return count, violations, fmt.Errorf("%s[%d] decode failed: %w", key, count, err)
			}
			violations = append(violations, auditCapture(capture, count)...)
			count++
		}
		_, _ = decoder.Token()
	}
	_, _ = decoder.Token()
	return count, violations, nil
}

func auditCapture(capture map[string]any, index int) []string {
	prefix := fmt.Sprintf("capture[%d]", index)
	violations := make([]string, 0)
	if value, _ := capture["schema"].(string); value != "wavei.war_room.capture.v1" && value != "wavei.sheets.append.v1" {
		violations = append(violations, fmt.Sprintf("%s schema mismatch", prefix))
	}
	if value, _ := capture["capturedAt"].(string); strings.TrimSpace(value) == "" {
		violations = append(violations, fmt.Sprintf("%s missing capturedAt", prefix))
	}
	if rows, ok := capture["data"].([]any); ok {
		for rowIndex, row := range rows {
			cells, ok := row.([]any)
			if !ok || len(cells) < 7 {
				violations = append(violations, fmt.Sprintf("%s.data[%d] malformed", prefix, rowIndex))
				continue
			}
			truth, _ := cells[4].(string)
			if strings.TrimSpace(truth) == "" {
				violations = append(violations, fmt.Sprintf("%s.data[%d] missing truth class", prefix, rowIndex))
			}
			if strings.EqualFold(truth, "LIVE") && rowHasFakeSource(cells) {
				violations = append(violations, fmt.Sprintf("%s.data[%d] has LIVE truth with blocked source markers", prefix, rowIndex))
			}
		}
		return violations
	}

	statuses, ok := capture["refreshStatuses"].([]any)
	if !ok {
		violations = append(violations, fmt.Sprintf("%s missing data or refreshStatuses array", prefix))
		return violations
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
			violations = append(violations, fmt.Sprintf("%s.refreshStatuses[%d] has LIVE connectionStatus with blocked source markers", prefix, statusIndex))
		}
	}
	return violations
}

func rowHasFakeSource(cells []any) bool {
	for _, cell := range cells {
		value, ok := cell.(string)
		if ok && fakeSourcePattern.MatchString(value) {
			return true
		}
	}
	return false
}

func statusHasFakeSource(status map[string]any) bool {
	for _, key := range []string{"source", "reason", "symbol"} {
		value, _ := status[key].(string)
		if fakeSourcePattern.MatchString(value) {
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
		if ext != ".ts" && ext != ".tsx" && ext != ".kt" {
			return nil
		}

		fileViolations, scanErr := auditSourceFile(path)
		if scanErr != nil {
			return scanErr
		}
		violations = append(violations, fileViolations...)
		return nil
	})
	if err != nil {
		return err
	}
	if len(violations) > 0 {
		return fmt.Errorf(strings.Join(violations, "; "))
	}
	return nil
}

func auditSourceFile(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	violations := make([]string, 0)
	hasLiveTruth := false
	hasFakeSource := false
	isWaveIUI := strings.HasPrefix(filepath.ToSlash(path), "artifacts/wave-i/src/")

	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 1024), 1024*1024)
	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		lower := strings.ToLower(scanner.Text())
		if strings.Contains(lower, "truthclass.live") ||
			strings.Contains(lower, "truthclass: 'live'") ||
			strings.Contains(lower, "truthclass: \"live\"") ||
			strings.Contains(lower, "truthclass = truthclass.live") ||
			strings.Contains(lower, "\"live\"") ||
			strings.Contains(lower, "'live'") {
			hasLiveTruth = true
		}
		if fakeSourcePattern.MatchString(lower) {
			hasFakeSource = true
		}
		if isWaveIUI {
			for _, blocked := range []string{"@atlaskit/", "atlassian", "jira", "jira-client", "@jira/"} {
				if strings.Contains(lower, blocked) {
					violations = append(violations, fmt.Sprintf("%s:%d blocked Atlassian/Jira dependency marker %q", path, lineNumber, blocked))
				}
			}
			if strings.Contains(lower, "hardcodedthreshold") || strings.Contains(lower, "hard-coded threshold") || strings.Contains(lower, "hard coded threshold") {
				violations = append(violations, fmt.Sprintf("%s:%d hard-coded threshold marker detected", path, lineNumber))
			}
		}
	}
	if err := scanner.Err(); err != nil && err != io.EOF {
		return nil, err
	}
	if hasLiveTruth && hasFakeSource {
		violations = append(violations, fmt.Sprintf("%s fake confidence detected", path))
	}
	return violations, nil
}
