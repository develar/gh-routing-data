package main

import (
	"github.com/develar/errors"
	"github.com/panjf2000/ants"
	"os"
	"os/exec"
	"path/filepath"
)

func (t *Builder) upload(regionName string) error {
	if t.executeContext.Err() != nil {
		return nil
	}

	// do not in parallel (no sense because build is skipped)
	command := exec.CommandContext(t.executeContext, "node", filepath.Join(getNodeJsScriptDir(), "locus-action-generator.js"), regionName)
	// don't prefix otherwise mc coloring is broken
	command.Stdout = os.Stderr
	command.Stderr = os.Stderr
	err := command.Run()
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (t *Builder) addFileToUploadQueue(regionName string) {
	if !t.isUpload {
		return
	}

	go func() {
		t.uploadWaitGroup.Add(1)
		err := t.uploadPool.Serve(regionName)
		if err != nil && err != ants.ErrPoolClosed {
			t.uploadWaitGroup.Done()
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
			t.appendError("cannot upload " + regionName + ": " + err.Error())
		}
	})
	if err != nil {
		return errors.WithStack(err)
	}
	return nil
}

func (t *Builder) WaitAndCloseUploadPool() error {
	if !t.isUpload {
		return nil
	}

	if t.executeContext.Err() == nil {
		t.uploadWaitGroup.Wait()
	}
	return t.uploadPool.Release()
}
