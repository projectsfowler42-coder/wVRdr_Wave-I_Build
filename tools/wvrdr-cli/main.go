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

const (
	defaultCaptureHistoryPath = "wavei_war_room_capture_history_v1.json"
	waveIArtifactDir          = "artifacts/wave-i"
	waveISrcDir               = "artifacts/wave-i/src"
	waveIDistDir              = "artifacts/wave-i/dist"
	shadowEnvFile             = "tools/wvrdr-cli/execution/env.go"
)

var (
	fakeSourcePattern = regexp.MustCompile(`(?i)(^|[^a-z0-9])(mock|sim|fake|proxy)([^a-z0-9]|$)`)
	liveTruthPattern  = regexp.MustCompile(`(?i)(truthclass\s*[:.=]\s*["']?live["']?|truthclass\.live|connectionstatus\s*[:.=]\s*["']?live["']?|\bLIVE\b)`)
)

type marshallGate struct {
	ID   string
	Name string
	Run  func() error
}

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "validate":
			if err := runSevenGateMarshall("."); err != nil {
				fmt.Fprintf(os.Stderr, "[MARSHALL] 7-Gate Audit: FAIL: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("[MARSHALL] 7-Gate Audit: PASS")
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

func runSevenGateMarshall(root string) error {
	gates := []marshallGate{
		{ID: "Gate 1", Name: "Truth Spine source audit", Run: func() error { return validateTruthSpine(root) }},
		{ID: "Gate 2", Name: "Wave-I PWA source tree present", Run: func() error { return requireDir(filepath.Join(root, waveISrcDir)) }},
		{ID: "Gate 3", Name: "GitHub Pages build path configured", Run: func() error { return requireWorkflowBuildPath(root) }},
		{ID: "Gate 4", Name: "No blocked Atlassian/Jira dependencies", Run: func() error { return rejectBlockedDependencyMarkers(root) }},
		{ID: "Gate 5", Name: "PWA manifest and service worker present", Run: func() error { return requirePWAAssets(root) }},
		{ID: "Gate 6", Name: "MDK resilience hooks present", Run: func() error { return requireMDKHooks(root) }},
		{ID: "Gate 7", Name: "Shadow execution lock preserved", Run: func() error { return requireShadowExecutionLock(root) }},
	}

	for _, gate := range gates {
		fmt.Printf("[MARSHALL] %s - %s... ", gate.ID, gate.Name)
		if err := gate.Run(); err != nil {
			fmt.Println("FAIL")
			fmt.Fprintf(os.Stderr, "[DIAGNOSTIC] gate=%s name=%q reason=%v\n", gate.ID, gate.Name, err)
			return fmt.Errorf("%s failed: %w", gate.ID, err)
		}
		fmt.Println("PASS")
	}
	return nil
}

func requireDir(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("%s is not a directory", path)
	}
	return nil
}

func requireFile(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return fmt.Errorf("%s is a directory, expected file", path)
	}
	return nil
}

func requireWorkflowBuildPath(root string) error {
	workflow := filepath.Join(root, ".github", "workflows", "deploy-wave-i.yml")
	content, err := os.ReadFile(workflow)
	if err != nil {
		return fmt.Errorf("workflow unavailable at %s: %w", workflow, err)
	}
	text := string(content)
	required := []string{
		"pnpm --filter @workspace/wave-i run typecheck",
		"pnpm --filter @workspace/wave-i run test",
		"pnpm --filter @workspace/wave-i run build",
		"path: artifacts/wave-i/dist",
		"actions/deploy-pages@v4",
	}
	for _, needle := range required {
		if !strings.Contains(text, needle) {
			return fmt.Errorf("%s missing %q", workflow, needle)
		}
	}
	if strings.Contains(text, "artifacts/wave-i/dist/public") {
		return fmt.Errorf("%s still points to deprecated dist/public rescue path", workflow)
	}
	return nil
}

func requirePWAAssets(root string) error {
	for _, path := range []string{
		filepath.Join(root, waveIArtifactDir, "public", "manifest.webmanifest"),
		filepath.Join(root, waveIArtifactDir, "public", "sw.js"),
		filepath.Join(root, waveIArtifactDir, "index.html"),
	} {
		if err := requireFile(path); err != nil {
			return err
		}
	}
	manifestPath := filepath.Join(root, waveIArtifactDir, "public", "manifest.webmanifest")
	manifest, err := os.ReadFile(manifestPath)
	if err != nil {
		return err
	}
	manifestText := string(manifest)
	for _, needle := range []string{"\"display\": \"standalone\"", "\"orientation\": \"portrait\""} {
		if !strings.Contains(manifestText, needle) {
			return fmt.Errorf("%s missing %s", manifestPath, needle)
		}
	}
	return nil
}

func requireMDKHooks(root string) error {
	mdkPath := filepath.Join(root, waveISrcDir, "lib", "mdk.ts")
	if err := requireFile(mdkPath); err != nil {
		return err
	}
	appPath := filepath.Join(root, waveISrcDir, "App.tsx")
	app, err := os.ReadFile(appPath)
	if err != nil {
		return err
	}
	appText := string(app)
	for _, needle := range []string{"runMdkSelfTest", "MDK SELF TEST", "AbortController", "FETCH_TIMEOUT_MS"} {
		if !strings.Contains(appText, needle) {
			return fmt.Errorf("%s missing MDK/timeout hook %q", appPath, needle)
		}
	}
	walPath := filepath.Join(root, waveISrcDir, "lib", "wal.ts")
	wal, err := os.ReadFile(walPath)
	if err != nil {
		return err
	}
	walText := string(wal)
	for _, needle := range []string{"StorageMode", "MEMORY", "getStorageMode"} {
		if !strings.Contains(walText, needle) {
			return fmt.Errorf("%s missing storage fallback marker %q", walPath, needle)
		}
	}
	return nil
}

func requireShadowExecutionLock(root string) error {
	path := filepath.Join(root, shadowEnvFile)
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("shadow lock file unavailable at %s: %w", path, err)
	}
	text := string(content)
	for _, needle := range []string{"Mode:             \"SHADOW\"", "AllowLiveOrders:  false", "VerifyLiveSafety"} {
		if !strings.Contains(text, needle) {
			return fmt.Errorf("%s missing safety marker %q", path, needle)
		}
	}
	return nil
}

func rejectBlockedDependencyMarkers(root string) error {
	return walkSourceFiles(filepath.Join(root, waveISrcDir), func(path string, lineNumber int, line string) error {
		lower := strings.ToLower(line)
		for _, blocked := range []string{"@atlaskit/", "atlassian", "jira-client", "@jira/"} {
			if strings.Contains(lower, blocked) {
				return fmt.Errorf("%s:%d blocked dependency marker %q", path, lineNumber, blocked)
			}
		}
		return nil
	})
}

func validateTruthSpine(root string) error {
	return walkSourceFiles(filepath.Join(root, waveISrcDir), func(path string, lineNumber int, line string) error {
		lower := strings.ToLower(line)
		// Allow valid enum definitions, type declarations, truth mapping code, and documentation strings.
		// Block only same-line promotion of fake/proxy/sim/manual data to LIVE.
		if liveTruthPattern.MatchString(line) && fakeSourcePattern.MatchString(line) {
			return fmt.Errorf("%s:%d fake confidence: LIVE truth paired with fake/mock/sim/proxy marker", path, lineNumber)
		}
		if strings.Contains(lower, "hardcodedthreshold") || strings.Contains(lower, "hard-coded threshold") || strings.Contains(lower, "hard coded threshold") {
			return fmt.Errorf("%s:%d hard-coded threshold marker detected", path, lineNumber)
		}
		return nil
	})
}

func walkSourceFiles(root string, inspect func(path string, lineNumber int, line string) error) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, walkErr error) error {
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
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		scanner := bufio.NewScanner(file)
		scanner.Buffer(make([]byte, 1024), 1024*1024)
		lineNumber := 0
		for scanner.Scan() {
			lineNumber++
			if err := inspect(path, lineNumber, scanner.Text()); err != nil {
				return err
			}
		}
		if err := scanner.Err(); err != nil && err != io.EOF {
			return err
		}
		return nil
	})
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
