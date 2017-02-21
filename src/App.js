import React, { Component } from 'react';
import Teoria from 'teoria';
import Vex from 'vexflow';
import './App.css';

const startNotes = {
  treble: ['F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'],
  bass:   ['F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'],
};
const startOctaves = {
  treble: ['3', '3', '4', '4', '4', '4', '4', '4', '4'],
  bass:   ['2', '2', '3', '3', '3', '3', '3', '3', '3'],
};

const startAccidentals = ['', '#', '', 'b', ''];
const legalIntervals = [
  /*'P1'*/ 'P4', 'P5', 'P8', 
  /*'A1'*/ 'A4', 'A5', 'A8',
  /*'d1'*/ 'd4', 'd5', 'd8', 
  'M2', 'M3', 'M6', 'M7',
  'm2', 'm3', 'm6', 'm7',
  'A2', 'A3', 'A6', 'A7',
  'd2', 'd3', 'd6', 'd7',
];
const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

let interval;
let bottomNote;
let topNote;

function getCount() {
  return null;
}
function getQuestion(i) {
  const vf = new Vex.Flow.Factory({
    renderer: {selector: '_vex', width: 150, height: 220}
  });
  const score = vf.EasyScore();
  const system = vf.System();
  try {
    const clef = Math.random() > 0.4 ? 'treble' : 'bass'; // wee bit more treble
    interval = Teoria.interval(legalIntervals[Math.floor(Math.random() * legalIntervals.length)]);
    const rando = Math.floor(Math.random() * startNotes[clef].length);
    bottomNote = Teoria.note(
      startNotes[clef][rando] +
      startAccidentals[Math.floor(Math.random() * startAccidentals.length)] +
      startOctaves[clef][rando]
    );
    topNote = Teoria.interval(bottomNote, interval.toString());
    system.addStave({
      voices: [
        score.voice(score.notes(topNote.toString().replace('x', '##') + '/w', {clef})),
        score.voice(score.notes(bottomNote + '/w', {clef})),
      ]
    }).addClef(clef);

    vf.draw();    
  } catch(_){
    return getQuestion();
  }
  return vf.context.svg;
}

function getAnswer(i) {
  return (
    <div>
      <p>{interval.toString()}</p>
      <p>{pretty(bottomNote)} to {pretty(topNote)} is a {interval.quality(1)} {interval.name()}</p>
    </div>
  );
}

function getAudio() {
  const low = new Audio('samples/' + getFileNote(bottomNote) + '.mp3');
  const high = new Audio('samples/' + getFileNote(topNote) + '.mp3');
  return {
    low,
    high,
  };
}

function getNormalNote(note) {
  if (note.accidentalValue() === 0) { // no sharp, nor flats
    return note.toString().toUpperCase();
  }
  if (note.accidentalValue() === 1) { // sharp
    return note.toString().replace('#', '-').toUpperCase();
  }
  return null;
}

function getFileNote(note) {
  const res = getNormalNote(note) || getNormalNote(note.enharmonics()[0]) || getNormalNote(note.enharmonics()[1]);
  return res.replace('E-', 'F').replace('B-', 'C');
}

function pretty(note) {
  return note.name().toUpperCase() + 
    note.accidental()
      .replace('#', '♯')
      .replace(/b/g, '♭')
      .replace('x', '𝄪');
}
// the actual quiz is done, boring stuff follows...

class App extends Component {
  constructor() {
    super();
    this.state = {
      question: getQuestion(1),
      answer: getAnswer(1),
      total: getCount(),
      i: 1,
      audio: getAudio(1),
      pause: false,
    };
    window.addEventListener('keydown', (e) => {
      // space bar
      if (e.keyCode === 32 || e.charCode === 32) {
        e.preventDefault();
        this.play();
      }
      // p and P
      if (e.keyCode === 112 || e.charCode === 112 || e.keyCode === 80 || e.charCode === 80) {
        e.preventDefault();
        this.play();
      }
      // right arrow
      if (e.keyCode === 39 || e.charCode === 39) {
        e.preventDefault();
        this.nextQuestion();
      }
      // n and N
      if (e.keyCode === 110 || e.charCode === 110 || e.keyCode === 78 || e.charCode === 78) {
        e.preventDefault();
        this.nextQuestion();
      }
    });
  }
  
  nextQuestion() {
    this.pause()
    this.setState({
      question: getQuestion(this.state.i + 1),
      answer: getAnswer(this.state.i + 1),
      i: this.state.i + 1,
      audio: getAudio(this.state.i + 1),
    });
  }
 
  pause() {
    const low = this.state.audio.low;
    const high = this.state.audio.high;
    low.pause();
    high.pause();
    low.currentTime = 0;
    high.currentTime = 0;
    this.setState({pause: true});
  }
   
  play() {
    this.pause();
    this.setState({pause: false});
    const low = this.state.audio.low;
    const high = this.state.audio.high;
    if (iOS) {
      low.play();
      high.play();
      return;
    }
    low.play(); 
    setTimeout(() => {
      if (this.state.pause) return;
      high.play();
      setTimeout(() => {
        if (this.state.pause) return;
        low.currentTime = 0; low.play();
        high.currentTime = 0; high.play();
      }, 1000);
    }, 1000);
  }
  
  render() {
    return (
      <div>
        {
          this.state.total 
            ? <Count i={this.state.i} total={this.state.total} />
            : null
        }
        <Flashcard 
          question={this.state.question}
          answer={this.state.answer}
        />
        <button 
          className="playButton" 
          onClick={this.play.bind(this)}>
          {iOS ? 'play' : '▶'}
        </button>
        {' '}
        {
          (this.state.total && this.state.i >= this.state.total)
            ? null
            : <button 
                className="nextButton" 
                onClick={this.nextQuestion.bind(this)}>
                next...
              </button>
        }
      </div>
    );
  }
}

class Flashcard extends Component {

  constructor() {
    super();
    this.state = {
      reveal: false,
    };
    window.addEventListener('keydown', (e) => {
      // arrows
      if (e.keyCode === 38 || e.charCode === 38 || e.keyCode === 40 || e.charCode === 40) {
        this.flip();
      }
      // f and F
      if (e.keyCode === 102 || e.charCode === 102 || e.keyCode === 70 || e.charCode === 70) {
        this.flip();
      }
    });
  }

  componentWillReceiveProps() {
    this.setState({reveal: false});
  }

  flip() {
    this.setState({
      reveal: !this.state.reveal,
    });
  }

  render() {
    const className = "card flip-container" + (this.state.reveal ? ' flip' : '');
    return (
      <div><center>
        <div className={className} onClick={this.flip.bind(this)}>
          <div className="flipper">
            <div className="front" style={{display: this.state.reveal ? 'none' : ''}}>
              <div dangerouslySetInnerHTML={{__html: this.props.question.outerHTML}} />
            </div>
            <div className="back" style={{display: this.state.reveal ? '' : 'none'}}>
              {this.props.answer}
            </div>
          </div>
        </div>
        <button className="answerButton" onClick={this.flip.bind(this)}>flip</button>
      </center></div>
    );
  }
}

const Count = ({i, total}) =>
  <div>
    Question {i} / {total}
  </div>;

export default App;
