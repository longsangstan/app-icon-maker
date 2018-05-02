import React, { Component } from "react";
import "./App.css";
import { contentJson, androidIcons } from "./config";

import Dropzone from "react-dropzone";

import loadImage from "image-promise";
import FileSaver from "file-saver";
import JSZip from "jszip";

const pica = require("pica")();
const PromiseFileReader = require("promise-file-reader");

async function resizeCanvas(canvasFrom, widthTo) {
    const canvasTo = document.createElement("canvas");
    canvasTo.width = widthTo;
    canvasTo.height = widthTo;

    const canvasBlob = await pica
        .resize(canvasFrom, canvasTo, {
            alpha: true
        })
        .then(result => pica.toBlob(result, "image/png"));

    return canvasBlob;
}

class App extends Component {
    state = {
        generating: false
    };

    onDropAccepted = async acceptedFiles => {
        this.setState({
            generating: true
        });

        const loadedFile = await PromiseFileReader.readAsDataURL(
            acceptedFiles[0]
        );

        // canvas - from
        const canvasFrom = document.createElement("canvas");
        const ctx = canvasFrom.getContext("2d");
        const img = await loadImage(loadedFile);
        canvasFrom.width = img.width;
        canvasFrom.height = img.height;
        ctx.drawImage(img, 0, 0);

        const zip = new JSZip();

        // ios
        for (let item of contentJson["images"]) {
            const size = item["size"].replace(/(^\d+)(.+$)/i, "$1");
            const scale = item["scale"].replace(/(^\d+)(.+$)/i, "$1");
            const widthTo = size * scale;

            const canvasBlob = await resizeCanvas(canvasFrom, widthTo);

            zip.file(`ios/AppIcon.appiconset/${item["filename"]}`, canvasBlob);
        }

        zip.file(
            "ios/AppIcon.appiconset/Contents.json",
            JSON.stringify(contentJson, null, "\t")
        );

        // android
        for (let item of androidIcons) {
            const widthTo = item["size"];

            const canvasBlob = await resizeCanvas(canvasFrom, widthTo);

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
                <h3>
                    APP ICON MAKER<br />
                    <span style={{ fontSize: 16, fontWeight: "normal" }}>
                        Generate icons for iOS & Android apps in one step.<br />
                        The source code is available on{" "}
                        <a
                            href="https://github.com/longsangstan/app-icon-maker"
                            target="_blank"
                        >
                            Github
                        </a>.
                    </span>
                </h3>
                <Dropzone
                    className="dropzone"
                    activeClassName="dropzone-active"
                    rejectClassName="dropzone-reject"
                    disabledClassName="dropzone-disabled"
                    disabled={this.state.generating}
                    onDropAccepted={this.onDropAccepted}
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
