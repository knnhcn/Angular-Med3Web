import { Component, OnInit } from '@angular/core';
import Med3Web from './scripts/med3web';
import * as $ from 'jquery';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { slider3dInitVal } from './slider3dInitVal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private m3w = null;
  private options = null;
  private loadFileObsArray: Observable<Blob>[] = [];

  opacityValue = 0.5;
  brightnessValue = 0.5;
  zcutValue = 0.5;
  qualityValue = 500;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.http.get('http://localhost:81/files_list.txt', {
      responseType: "text"
    }).toPromise().then(text => {
      this.initMed3Web();

      const splitted = text.split('\r').map(str => str.replace(/(\r\n|\n|\r)/gm, ""));
      
      splitted.forEach(fileName => {
        const obs = this.http.get(`http://localhost:81/${fileName}`, {
          responseType: "blob"
        });
        this.loadFileObsArray.push(obs);
      })
    }).then(() => {
      forkJoin(this.loadFileObsArray).subscribe(values => {
        const fileArray: File[] = values.map(blob => new File([blob], "local_dicom", {lastModified: 1534584790000}));
        this.loadFiles(fileArray);
      })
    });

  }

  private initMed3Web(): void {

    this.options = {
      container3d: $('#3d-container').val(0),
      container2d: $('#2d-container').val(0),
      // Load default volume
      loadUrlFile: '',
      loadType: 'dicom',
      menuUI: null
    };

    this.m3w = new Med3Web(this.options);
    const initBool = this.m3w.init();
    console.log('Initialized', initBool);
  }

  private loadFiles(fileArray: File[]): void {
    console.log('fileArray', fileArray.length);
    const dataType = 'undefined';
    const curFileDataType = slider3dInitVal[dataType];
    this.m3w.setCurFileDataType(curFileDataType);
    const fileType = 'local dicom';

    this.m3w.loadScene(fileArray, fileType);
    this.m3w.setRenderMode(1);
  }

  private loadFile(file: File) {
    const dataType = 'undefined';
    const curFileDataType = slider3dInitVal[dataType];
    this.m3w.setCurFileDataType(curFileDataType);
    const fileUrl = [file];
    const fileType = 'local dicom';

    this.m3w.loadScene(fileUrl, fileType);
    this.m3w.setRenderMode(1);
  }

  setOpacity(evt): void {
    this.m3w.m_engine3d.setOpacityBarrier(evt.value);
  }

  setBrightness(evt): void {
    this.m3w.m_engine3d.updateBrightness(evt.value);
  }

  setZCut(evt): void {
    this.m3w.m_engine3d.updateZCutPlane(evt.value);
  }

  setQuality(evt): void {
    this.m3w.m_engine3d.setStepsize(evt.value);
  }

}
