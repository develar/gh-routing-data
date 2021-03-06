package builder

import (
  "bytes"
  "crypto/md5"
  "encoding/base64"
  "github.com/cheggaaa/pb/v3"
  "github.com/develar/errors"
  "github.com/minio/minio-go/v6"
  "github.com/panjf2000/ants/v2"
  "go.uber.org/zap"
  "io"
  "os"
  "os/exec"
  "path"
  "path/filepath"
  "strings"
  "time"
)

const bucketName = "gh-routing-data"

// first char must be upper-case (minio will set to upper-case on set, so, on read we should use also upper-case)
const md5UserDataName = "Md5"

func (t *Builder) upload(regionName string) error {
	if t.ExecuteContext.Err() != nil {
		return nil
	}

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
	isNew := false
	if err != nil {
		errorResponse, ok := err.(minio.ErrorResponse)
		if !ok || errorResponse.Code != "NoSuchKey" {
			return err
		}

		isNew = true
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

	localChecksum, err := computeChecksum(err, fileReader)
	if err != nil {
		return err
	}

	fileSize := fileStat.Size()

	if isNew {
		t.Logger.Info("file is new", zap.String("file", objectPath))
	} else {
		remoteChecksum := objectInfo.UserMetadata[md5UserDataName]
		if localChecksum == remoteChecksum {
			if fileSize == objectInfo.Size {
				t.Logger.Info("file is not modified: skipping", zap.String("file", objectPath), zap.String("checksum", localChecksum))
				return nil
			} else {
				t.Logger.Info("checksums match but sizes differ: uploading", zap.String("file", objectPath), zap.String("checksum", localChecksum), zap.Int64("localSize", fileSize), zap.Int64("remoteSize", objectInfo.Size))
			}
		} else {
			t.Logger.Info("file is modified: skipping", zap.String("file", objectPath), zap.String("localChecksum", localChecksum), zap.String("remoteChecksum", remoteChecksum))
		}
	}

	// mbp https://github.com/vbauerster/mpb leads to high CPU usage (100-300%), so, just use single progress bar
  progressBar := pb.Start64(fileSize)
  // no need to refresh very often
  progressBar.SetRefreshRate(time.Second)
  progressBar.SetWriter(os.Stdout)
  progressBar.Set(pb.Bytes, true)

  if err = progressBar.Err(); err != nil {
    return err
  }

  defer progressBar.Finish()

	options := minio.PutObjectOptions{
		ContentType:  "application/zip",
		Progress:     &ProgressBarUpdater{bar: progressBar},
		UserMetadata: map[string]string{md5UserDataName: localChecksum},
	}
	_, err = t.uploader.PutObjectWithContext(t.ExecuteContext, bucketName, objectPath, fileReader, fileSize, options)
	if err != nil {
		t.Logger.Error("cannot upload", zap.Error(err))
		return err
	}

	return nil
}

type ProgressBarUpdater struct {
  bar *pb.ProgressBar
}

func (t *ProgressBarUpdater) Read(p []byte) (n int, err error) {
	t.bar.Add(len(p))
	return
}

func computeChecksum(err error, fileReader *os.File) (string, error) {
	h := md5.New()
	_, err = io.Copy(h, fileReader)
	if err != nil {
		return "", err
	}

	_, err = fileReader.Seek(0, 0)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil)), nil
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
      t.addUploadError(regionName, err)
		}
	}()
}

func (t *Builder) initUploadPool() error {
	var err error
	// 2 parallel uploads are enough
	poolSize := 2
	if !t.IsBuild {
    poolSize = 4
  }
	t.uploadPool, err = ants.NewPoolWithFunc(poolSize, func(payload interface{}) {
		defer t.uploadWaitGroup.Done()

		regionName := payload.(string)
		err = t.upload(regionName)
		if err != nil {
      t.addUploadError(regionName, err)
    }
  })
  if err != nil {
    return errors.WithStack(err)
  }

  t.uploader, err = minio.New(os.Getenv("ENDPOINT"), os.Getenv("ACCESS_KEY"), os.Getenv("SECRET_KEY") /* isSecure = */, true)
  if err != nil {
    return errors.WithStack(err)
  }

  return nil
}

func (t *Builder) addUploadError(regionName string, err error) {
  t.Logger.Error("cannot upload", zap.String("region", regionName), zap.Error(err))
  t.appendError("cannot upload " + regionName + ": " + err.Error())
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
