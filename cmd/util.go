package main

import (
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
	// don't buffer output for now
	//copyBufferedAsync(prefixer.New(stdoutPipe, aurora.Gray(prefix).String()), os.Stdout, 0)
	//copyBufferedAsync(prefixer.New(stderrPipe, aurora.Red(prefix).String()), os.Stderr, 0)

	go func() {
		_, _ = io.Copy(os.Stdout, prefixer.New(stdoutPipe, aurora.Gray(prefix).String()))
	}()
	go func() {
		_, _ = io.Copy(os.Stderr, prefixer.New(stderrPipe, aurora.Red(prefix).String()))
	}()
	return nil
}

//func copyBufferedAsync(prefixReader *prefixer.Prefixer, out io.Writer, minLineCount int) {
//	go func() {
//    var bufferedData []byte
//
//    defer func() {
//      if len(bufferedData) > 0 {
//        _, _ = out.Write(bufferedData)
//      }
//    }()
//
//		reader := bufio.NewReader(prefixReader)
//		lineCount := 0
//		for {
//			line, err := reader.ReadSlice('\n')
//			if err == io.EOF {
//				break
//			}
//
//			if err != nil {
//				log.Fatalf("%+v\n", err)
//			}
//
//			lineCount++
//			if lineCount <= minLineCount {
//				bufferedData = append(bufferedData, line...)
//			} else {
//			  if len(bufferedData) > 0 {
//          _, _ = out.Write(bufferedData)
//        }
//				_, _ = out.Write(line)
//				bufferedData = nil
//				lineCount = 0
//			}
//		}
//	}()
//}
