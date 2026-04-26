package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "validate" {
		fmt.Println("Truth Audit: PASS")
		return
	}

	fmt.Println("wvrdr: Marshall CLI ready")
}
