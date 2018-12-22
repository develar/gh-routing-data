package main

import (
	"bufio"
	"github.com/apex/log"
	"github.com/develar/errors"
	"github.com/goware/prefixer"
	"github.com/logrusorgru/aurora"
	"io"
	"os"
	"os/exec"
	"path/filepath"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func getJavaExecutablePath() string {
	javaHome := os.Getenv("JAVA_HOME")
	if javaHome == "" {
		return "java"
	} else {
		return filepath.Join(javaHome, "bin", "java")
	}
}

func outputWithPrefix(command *exec.Cmd, groupName string) error {
	stdoutPipe, err := command.StdoutPipe()
	if err != nil {
		return errors.WithStack(err)
	}

	stderrPipe, err := command.StderrPipe()
	if err != nil {
		return errors.WithStack(err)
	}

	prefix := groupName + " | "
	copyBufferedAsync(prefixer.New(stdoutPipe, aurora.Gray(prefix).String()), os.Stdout)

	// do not buffer error output
	go func() {
		_, _ = io.Copy(os.Stderr, prefixer.New(stderrPipe, aurora.Red(prefix).String()))
	}()

	return nil
}

func copyBufferedAsync(prefixReader *prefixer.Prefixer, out io.Writer) {
	go func() {
		reader := bufio.NewReader(prefixReader)
		var bufferedData []byte
		lineCount := 0
		for {
			line, err := reader.ReadSlice('\n')
			if err == io.EOF {
				break
			}

			if err != nil {
				log.Fatalf("%+v\n", err)
			}

			lineCount++
			if lineCount <= 4 {
				bufferedData = append(bufferedData, line...)
			} else {
				_, _ = out.Write(bufferedData)
				bufferedData = nil
				lineCount = 0
			}
		}

		if len(bufferedData) > 0 {
			_, _ = out.Write(bufferedData)
		}
	}()
}
