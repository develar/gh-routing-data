package builder

import (
	"bytes"
	"github.com/cheggaaa/pb"
	"github.com/develar/errors"
	"github.com/minio/minio-go/v6"
	"github.com/panjf2000/ants"
	"github.com/peak/s3hash"
	"go.uber.org/zap"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

const bucketName = "gh-routing-data"

func (t *Builder) upload(regionName string) error {
	if t.ExecuteContext.Err() != nil {
		return nil
	}

	// do not in parallel (no sense because build is skipped)
	command := exec.CommandContext(t.ExecuteContext, "node", filepath.Join(getNodeJsScriptDir(), "compress.js"), regionName)

	var stdout bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = os.Stderr
	err := command.Run()
	if err != nil {
		return errors.WithStack(err)
	}

	filesToUpload := strings.Split(stdout.String(), "\n")
	remoteDir := filesToUpload[0]
	err = t.uploadUsingMinio(remoteDir, filesToUpload[1:])
	if err != nil {
		return err
	}

	return nil
}

func (t *Builder) uploadUsingMinio(remoteDir string, filesToUpload []string) error {
	for _, filePath := range filesToUpload {
		err := t.uploadFile(filePath, bucketName, path.Join(remoteDir, path.Base(filePath)))
		if err != nil {
			return err
		}
	}

	return nil
}

func (t *Builder) uploadFile(filePath string, bucketName string, objectPath string) error {
	objectInfo, err := t.uploader.StatObjectWithContext(t.ExecuteContext, bucketName, objectPath, minio.StatObjectOptions{})
	if err != nil {
		return err
	}

	if objectInfo.ETag == "" {
		t.Logger.Info("file is new", zap.String("file", objectPath))
	} else {
		// default chunk size - 8MB
		eTag, err := s3hash.CalculateForFile(filePath, 8*1024*1024)
		if err != nil {
			return err
		}

		if eTag == objectInfo.ETag {
			t.Logger.Info("file is not modified and will be not uploaded", zap.String("file", objectPath), zap.String("eTag", eTag))
		} else {
			t.Logger.Info("file is modified and will be uploaded", zap.String("file", objectPath), zap.String("localETag", eTag), zap.String("remoteETag", objectInfo.ETag))
		}
	}

	fileReader, err := os.Open(filePath)
	if err != nil {
		return err
	}

	//noinspection GoUnhandledErrorResult
	defer fileReader.Close()

	fileStat, err := fileReader.Stat()
	if err != nil {
		return err
	}

	progress := pb.New64(fileStat.Size())
	progress.Start()
	defer progress.Finish()

	options := minio.PutObjectOptions{ContentType: "application/zip", Progress: progress.NewProxyReader(fileReader)}
	_, err = t.uploader.PutObjectWithContext(t.ExecuteContext, bucketName, objectPath, fileReader, fileStat.Size(), options)
	if err != nil {
		t.Logger.Error("cannot upload", zap.Error(err))
		return err
	}

	return nil
}

func (t *Builder) addFileToUploadQueue(regionName string) {
	if !t.IsUpload {
		return
	}

	t.uploadWaitGroup.Add(1)

	go func() {
		err := t.uploadPool.Invoke(regionName)
		if err != nil && err != ants.ErrPoolClosed {
			t.uploadWaitGroup.Done()
			t.Logger.Error("cannot upload", zap.String("region", regionName), zap.Error(err))
			t.appendError("cannot upload " + regionName + ": " + err.Error())
		}
	}()
}

func (t *Builder) initUploadPool() error {
	var err error
	t.uploadPool, err = ants.NewPoolWithFunc(2 /* 2 parallel uploads are enough */, func(payload interface{}) {
		defer t.uploadWaitGroup.Done()

		regionName := payload.(string)
		err = t.upload(regionName)
		if err != nil {
			t.Logger.Error("cannot upload", zap.String("region", regionName), zap.Error(err))
			t.appendError("cannot upload " + regionName + ": " + err.Error())
		}
	})
	if err != nil {
		return errors.WithStack(err)
	}

	t.uploader, err = minio.New(os.Getenv("ENDPOINT"), os.Getenv("ACCESS_KEY"), os.Getenv("SECRET_KEY") /* isSecure = */, true)
	if err != nil {
		log.Fatalln(err)
	}
	return nil
}

func (t *Builder) WaitAndCloseUploadPool() error {
	if !t.IsUpload {
		return nil
	}

	if t.ExecuteContext.Err() == nil {
		t.uploadWaitGroup.Wait()
	}
	t.uploadPool.Release()
	return nil
}
