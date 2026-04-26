package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "validate" {
		if err := validateTruthSpine("."); err != nil {
			fmt.Fprintf(os.Stderr, "Truth Audit: FAIL: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Truth Audit: PASS")
		return
	}

	fmt.Println("wvrdr: Marshall CLI ready")
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
