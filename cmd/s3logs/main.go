package main

import (
	"bufio"
	"encoding/csv"
	"flag"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

var serverUrl = "https://s3.eu-central-1.wasabisys.com/gh-routing-data"

func main() {
	logDir := flag.String("dir", "/Volumes/data/gh-logs", "")

	flag.Parse()

	err := processDir(*logDir)
	if err != nil {
		log.Fatal(err)
	}

	//log.Printf("%s", data)
}

func processDir(dir string) error {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return err
	}

	outFile, err := os.Create("/Volumes/data/gh-logs.txt")
	if err != nil {
		return err
	}

	//noinspection GoUnhandledErrorResult
	defer outFile.Close()

	writer := bufio.NewWriter(outFile)
	defer func() {
		err := writer.Flush()
		if err != nil {
			log.Fatal(err)
		}
	}()

	for _, fileInfo := range files {
		err = parseFile(dir, fileInfo, writer)
		if err != nil {
			return err
		}
	}

	return nil
}

// [25/Jan/2020:19:19:35 +0000] parsed as 2: [25/Jan/2020:19:19:35 3: +0000] because space is not escaped
// so, each index +1 to https://docs.aws.amazon.com/AmazonS3/latest/dev/LogFormat.html
const s3MethodIndex = 7
const statusIndex = 10
const bytesSentIndex = 12

const remoteIpIndex = 4
const requesterIndex = 5

func parseFile(dir string, fileInfo os.FileInfo, writer *bufio.Writer) error {
	fileName := fileInfo.Name()
	if fileName[0] == '.' {
		return nil
	}

	file, err := os.Open(filepath.Join(dir, fileName))
	if err != nil {
		log.Fatal(err)
	}

	//noinspection GoUnhandledErrorResult
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = ' '
	for {
		entry, err := reader.Read()
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}

		s3Method := entry[s3MethodIndex]
		//noinspection SpellCheckingInspection
		if strings.HasPrefix(s3Method, "REST.PUT.") || s3Method == "REST.GET.PUBLICACCESS" || s3Method == "REST.GET.BUCKET" || s3Method == "REST.GET.VERSIONING" || s3Method == "REST.GET.LOGGING" ||
			strings.HasPrefix(s3Method, "REST.GET.BUCKET") ||
			strings.HasSuffix(s3Method, ".BUCKET") ||
			s3Method == "REST.GET.ACL" ||
			s3Method == "REST.GET.LOCATION" ||
			s3Method == "REST.DELETE.OBJECT" ||
			s3Method == "REST.GET.COMPLIANCE" {
			continue
		}

		status := entry[statusIndex]

		// 127.0.0.1 user-identifier frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326

		// is the IP address of the client (remote host) which made the request to the server.
		_, _ = writer.WriteString(entry[remoteIpIndex])
		_, _ = writer.WriteRune(' ')

		// user-identifier is the RFC 1413 identity of the client. Usually "-".
		requester := entry[requesterIndex]
		if requester == "Anonymous" {
			requester = "-"
		}
		_, _ = writer.WriteString(requester)
		_, _ = writer.WriteRune(' ')

		// frank is the user id of the person requesting the document. Usually "-" unless .htaccess has requested authentication.
		_, _ = writer.WriteRune('-')
		_, _ = writer.WriteRune(' ')

		// [10/Oct/2000:13:55:36 -0700] is the date, time, and time zone that the request was received, by default in strftime format %d/%b/%Y:%H:%M:%S %z.
		_, _ = writer.WriteString(entry[2])
		_, _ = writer.WriteRune(' ')
		_, _ = writer.WriteString(entry[3])
		_, _ = writer.WriteRune(' ')

		// "GET /apache_pb.gif HTTP/1.0" is the request line from the client. The method GET, /apache_pb.gif the resource requested, and HTTP/1.0 the HTTP protocol.
		_, _ = writer.WriteRune('"')
		_, _ = writer.WriteString(entry[9])
		_, _ = writer.WriteString(" HTTP/1.1")
		_, _ = writer.WriteRune('"')
		_, _ = writer.WriteRune(' ')

		// 200 is the HTTP status code returned to the client. 2xx is a successful response, 3xx a redirection, 4xx a client error, and 5xx a server error.
		_, _ = writer.WriteString(status)
		_, _ = writer.WriteRune(' ')

		// 2326 is the size of the object returned to the client, measured in bytes.
		bytesSent := entry[bytesSentIndex]
		if s3Method == "REST.GET.OBJECT" {
			if status == "200" {
				// wasabi doesn't specify it, just use object size
				if bytesSent == "-" {
					bytesSent = entry[bytesSentIndex+1]
				}
			}
		} else if s3Method != "REST.HEAD.OBJECT" {
			log.Printf("unknown method: " + s3Method)
		}
		_, _ = writer.WriteString(bytesSent)

		// Referer
		writeQuotedString(entry[16], writer)

		// User-Agent
		writeQuotedString(entry[17], writer)

		//for index, s := range entry {
		//  if index != 0 {
		//    _, _ = writer.WriteRune(' ')
		//  }
		//
		//  if len(s) == 0 {
		//    // empty string as `""` (for some values `-` is not used as empty value)
		//    _, _ = writer.WriteString(`""`)
		//    continue
		//  }
		//
		//  unescaped := strings.ContainsRune(s, ' ')
		//
		//  if unescaped {
		//    writer.WriteRune('"')
		//  }
		//  _, _ = writer.WriteString(s)
		//  if unescaped {
		//    _, _ = writer.WriteRune('"')
		//  }
		//}

		_, _ = writer.WriteRune('\n')
	}

	return nil
}

func writeQuotedString(s string, writer *bufio.Writer) {
	_, _ = writer.WriteRune(' ')
	_, _ = writer.WriteRune('"')
	if s == "" {
		_, _ = writer.WriteRune('-')
	} else {
		_, _ = writer.WriteString(s)
	}
	_, _ = writer.WriteRune('"')
}

type Client struct {
	Id string `csv:"id"`
}
