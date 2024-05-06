import { MouseEventHandler, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

import { Play, Pause, Plus, DownloadCloud, Save } from "lucide-react";

var wavesurfer: WaveSurfer;
function App() {
  const [timePreview, setTimePreview] = useState<number>(0);
  const [timeStamps, setTimeStamps] = useState<number[]>([]);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const [waveWidth, setWaveWidth] = useState(2000);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(0.8);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const playAudio = () => {
    if (wavesurfer) {
      if (isAudioPlaying) {
        wavesurfer.pause();
        setIsAudioPlaying(false);
      } else {
        wavesurfer.play();
        setIsAudioPlaying(true);
      }
    }
  };

  const downloadJSON = () => {
    if (timeStamps.length <= 0) return;

    const musicname = prompt("Music Name ?");
    if (!musicname) return;

    const jsondata = JSON.stringify({
      song: musicname,
      timestamps: timeStamps,
    });

    const blob = new Blob([jsondata], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = musicname + ".json";
    a.href = url;
    a.click();
    a.remove();
  };

  const loadAudio = async () => {
    setTimeStamps([]);
    setIsAudioPlaying(false);

    if (!audioFileRef.current) return;
    if (!audioFileRef.current.files) return;

    const { current: div } = waveContainerRef;

    if (div) {
      for (let cn of div.children) cn.remove();
    }

    const file = audioFileRef.current?.files[0];

    const reader = new FileReader();
    reader.onload = async function (e) {
      if (!e.target) return;
      const _url = URL.createObjectURL(file);

      wavesurfer = WaveSurfer.create({
        container: "#wave-container",
        waveColor: "#fff",
        progressColor: "#f00",
        url: _url,
        // barGap: 1,
        autoScroll: true,
        audioRate: audioSpeed,

        dragToSeek: true,
        barHeight: 2,
        cursorColor: "#0f0",
        width: waveWidth,
      });

      const arrayBuffer = e.target.result
      if (typeof arrayBuffer==="string" || !arrayBuffer) return;
      const decordAudioData = new AudioContext().decodeAudioData(arrayBuffer);
      const duration = (await decordAudioData).duration;

      wavesurfer.on("click", (e) => {
        const time = e * duration;
        setTimePreview(parseFloat(time.toFixed(3)));
      });

      wavesurfer.on("audioprocess", (e) => {
        setTimePreview(parseFloat(e.toFixed(3)));
      });

      setIsAudioLoaded(true);
    };

    reader.onerror = (e) => {
      if (!e.target?.error) return;
      console.error("File could not be read! Code " + e.target.error.code);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <section className="w-full lg:w-[1000px] px-10 flex flex-col gap-2 justify-center items-center">
        {timeStamps.length > 0 && (
          <button
            className="flex w-full justify-center gap-2 items-center"
            onClick={downloadJSON}
          >
            <Save size={20} /> Download data JSON
          </button>
        )}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm">Audio URL</label>
          <input className="w-full p-2 rounded-lg bg-black" type="file" accept="audio/*" ref={audioFileRef} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm ">Stretch</label>
            <input
              type="number"
              defaultValue={waveWidth}
              className="w-full p-2 rounded-lg"
              onChange={(e) => setWaveWidth(parseInt(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm ">Tempo</label>
            <input
              type="number"
              onChange={(e) => setAudioSpeed(parseInt(e.target.value))}
              defaultValue={audioSpeed}
              className="w-full p-2 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={loadAudio}
            className="flex gap-1 w-full items-center justify-center"
          >
            <DownloadCloud size={16} /> Load
          </button>
        </div>

        <div
          id="wave-container"
          ref={waveContainerRef}
          className="w-[100%] overflow-scroll"
        ></div>
        {isAudioLoaded && (
          <div className="grid grid-cols-4 w-full justify-between items-center gap-2">
            <span className="col-span-2 text-center border-b py-2">
              {timePreview}
            </span>
            <button
              onClick={() => {
                const t = timeStamps.find((t) => t == timePreview);
                if (t) {
                  alert("There Cannot be two Same timestamps !!");
                  return;
                }
                setTimeStamps([...timeStamps, timePreview]);
              }}
            >
              <Plus />
            </button>
            <button className="" onClick={playAudio}>
              {isAudioPlaying ? <Pause /> : <Play />}
            </button>
          </div>
        )}
        <div className="grid grid-cols-5 w-full gap-2 overflow-y-scroll h-[100px]">
          {timeStamps.map((t) => (
            <TimeStampComponent
              key={t}
              time={t}
              onClick={() =>
                setTimeStamps([...timeStamps.filter((tm) => tm != t)])
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}

const TimeStampComponent = (props: {
  time: number;
  onClick: MouseEventHandler;
}) => {
  return (
    <button
      className="text-center text-sm px-1 py-0 w-full bg-red-400"
      onClick={props.onClick}
    >
      {props.time}
    </button>
  );
};

export default App;
