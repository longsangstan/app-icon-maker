import React, { Component } from "react";
import "./App.css";
import { contentJson, androidIcons } from "./config";

import Dropzone from "react-dropzone";

import loadImage from "image-promise";
import FileSaver from "file-saver";
import JSZip from "jszip";

const pica = require("pica")();
const PromiseFileReader = require("promise-file-reader");

class App extends Component {
    state = {
        generating: false
    };

    onDrop = async acceptedFiles => {
        this.setState({
            generating: true
        });

        const loadedFile = await PromiseFileReader.readAsDataURL(
            acceptedFiles[0]
        );

        // canvas - from
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = await loadImage(loadedFile);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const zip = new JSZip();

        // ios
        for (let item of contentJson["images"]) {
            let size = item["size"].replace(/(^\d+)(.+$)/i, "$1");
            let scale = item["scale"].replace(/(^\d+)(.+$)/i, "$1");

            let width = size * scale;

            let canvasTo = document.createElement("canvas");
            canvasTo.width = width;
            canvasTo.height = width;

            let canvasBlob = await pica
                .resize(canvas, canvasTo, {
                    alpha: true
                })
                .then(result => pica.toBlob(result, "image/png"));

            zip.file(`ios/AppIcon.appiconset/${item["filename"]}`, canvasBlob);
        }

        zip.file(
            "ios/AppIcon.appiconset/Contents.json",
            JSON.stringify(contentJson, null, "\t")
        );

        // android
        for (let item of androidIcons) {
            let width = item["size"];

            let canvasTo = document.createElement("canvas");
            canvasTo.width = width;
            canvasTo.height = width;

            let canvasBlob = await pica
                .resize(canvas, canvasTo, {
                    alpha: true
                })
                .then(result => pica.toBlob(result, "image/png"));

            zip.file(item["filename"], canvasBlob);
        }

        // download
        const blob = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(blob, "icons.zip");

        this.setState({
            generating: false
        });
    };

    render() {
        return (
            <div className="App">
                <h3>Generate icons for iOS & Android apps in one step.</h3>
                <Dropzone
                    className="dropzone"
                    onDrop={this.onDrop}
                    multiple={false}
                    accept="image/jpeg, image/png"
                >
                    {this.state.generating ? (
                        <p>Generating...</p>
                    ) : (
                        <p>
                            Drop an image here.
                            <br />
                            Recommended size: 1024px * 1024px.
                            <br />
                            Supported Formats: png, jpg.
                        </p>
                    )}
                </Dropzone>
                <p>
                    <a href="https://clss.hk" target="_blank">
                        ⚡Powered by CLSS.hk
                    </a>
                </p>
            </div>
        );
    }
}

export default App;
