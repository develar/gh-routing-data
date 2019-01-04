package builder

import (
	"os"
	"path/filepath"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func getJavaExecutablePath() string {
	javaHome := os.Getenv("JAVA_HOME")
	if len(javaHome) == 0 {
		return "java"
	} else {
		return filepath.Join(javaHome, "bin", "java")
	}
}
