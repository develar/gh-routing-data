package builder

import (
	"bytes"
	"github.com/develar/errors"
	"github.com/panjf2000/ants"
	"go.uber.org/zap"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const serverIpV6 = "2001:bc8:4728:da09::1"

func (t *Builder) upload(regionName string) error {
	if t.ExecuteContext.Err() != nil {
		return nil
	}

	// do not in parallel (no sense because build is skipped)
	command := exec.CommandContext(t.ExecuteContext, "node", filepath.Join(getNodeJsScriptDir(), "locus-action-generator.js"), regionName)

	var stdout bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = os.Stderr
	err := command.Run()
	if err != nil {
		return errors.WithStack(err)
	}

	filesToUpload := strings.Split(stdout.String(), "\n")
	remoteDir := "/var/www/" + filesToUpload[0]
	err = t.uploadUsingRsync(remoteDir, filesToUpload[1:])
	if err != nil {
		return err
	}

	return nil
}

func (t *Builder) uploadUsingRsync(remoteDir string, filesToUpload []string) error {
	var args []string
	args = append(args, "--rsync-path='sudo -u caddy mkdir -p "+remoteDir+" && rsync'", "--chown=caddy:caddy", "--human-readable", "--progress")
	args = append(args, filesToUpload...)
	args = append(args, "root@["+serverIpV6+"]:"+remoteDir+"/")

	command := exec.CommandContext(t.ExecuteContext, "/bin/sh", "-c", "rsync "+strings.Join(args, " "))

	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	err := command.Run()
	if err != nil {
		return errors.WithStack(err)
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
