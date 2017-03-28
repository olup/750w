import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import moment from 'moment'

var getCaretCoordinates = require('caretPos');

export default class App extends Component {
    constructor(props){
        super(props)
        this.state = {
            text : "", 
            title : "",
            tags : "",
            words : 0,
            modal : false,
            options : {
                spellCheck : false,
                color : true,
                scroll : true,
                nedit : false
            }
        }
    }

    componentDidMount(){
        var _this = this
        document.querySelector('textarea').addEventListener('input', function () {
            var coordinates = getCaretCoordinates(this, this.selectionEnd);
            var bodyRect = document.body.getBoundingClientRect()
            var rect = this.getBoundingClientRect();
            var offset   = rect.top - bodyRect.top;
            var maxHeight = document.documentElement.clientHeight- 200;
            var minHeight = 200;
            var pos = coordinates.top + rect.top;
            var scroll = _this.state.options.scroll
            if (scroll && pos > maxHeight) window.scroll(0, offset + coordinates.top - maxHeight )
            if (scroll && pos<minHeight) window.scroll(0, offset + coordinates.top - minHeight )
            
        })
    }

    Save(){
        var {text, title, tags} = this.state
        var date = moment().format("DD_MM_YYYY")
        var filename = `750w-${date}-${title}.txt`
        var fileContent = `---
title : ${title}
date : ${date}
time :
tags : ${tags}
---
 
${text}`

        fileContent = fileContent.replace(/\n/g,"\r\n")

        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        this.setState({modal : false})
    }

    render(){
        var wordCount = countWords(this.state.text)
        return <div className={this.state.options.color ? "wrapper color" : "wrapper"}>
                <LoadBar words={wordCount}/>
                {this.state.modal && <Modal  offDisplay={()=>this.setState({modal : false})}  onSave={this.Save.bind(this)} onChange={(title="",tags="")=>this.setState({title,tags})}/>}
                {wordCount > 750 && <SaveButton text={this.state.text} onClick={()=>this.setState({modal : true})}/>}
                <Editor onChange={text=> this.setState({text})} options={this.state.options} blurry={this.state.modal}/>
                <Options onChange={options=>this.setState({options})} />
            </div>
    }
}

class Editor extends Component {
    constructor(props){
        super(props)
        this.state = {text : ""}
    }
    TextChange(e){
        var text = e.target.value
        this.props.onChange(text)
        this.setState({text})
    }
    handleKeyPress (event){
        if(this.props.options.nedit){
            if(event.key == 'Backspace'){
                event.preventDefault()
            }
        }
        
    }
    handleClick(e){
        if(this.props.options.nedit){
            var el = this.textarea
            if (typeof el.selectionStart == "number") {
                el.selectionStart = el.selectionEnd = el.value.length;
            } else if (typeof el.createTextRange != "undefined") {
                el.focus();
                var range = el.createTextRange();
                range.collapse(false);
                range.select();
            }
        }
    }
    render(){
        var options = this.props.options
        return <div className={this.props.blurry ? "editor container blurry" : "editor container"}
                    onClick={()=>this.textarea.focus()}>
                <Textarea 
                    spellCheck={options.spellCheck}
                    ref={(elem) => this.textarea = elem }
                    className="textarea" 
                    value={this.state.text} 
                    onChange={this.TextChange.bind(this)} 
                    placeholder="Start writing..."
                    onKeyDown={this.handleKeyPress.bind(this)}
                    onClick={this.handleClick.bind(this)}>
                </Textarea>
            </div>
    }
}

class LoadBar extends Component {
    render(){
        var width = (100/750) * this.props.words
        return <div className="load-bar-container">
                <div className="container">
                    <div className="load-bar" style={{width : width+"%"}}></div>
                </div>
            </div>
    }
}

class Modal extends Component {
    constructor(props){
        super(props)
        this.state = {
            title : "",
            text : ""
        }
    }
    componentDidUpdate(pp,ps){
        if(ps.title != this.state.title || ps.tags != this.state.tags) this.props.onChange(this.state.title, this.state.tags)
    }
    render(){
        return <div className="modal-container" onClick={this.props.offDisplay.bind(this)}>
                <div className="modal" onClick={e=>e.stopPropagation()}>
                    <div className="title">Save your words</div>
                    <div className="body">
                        <div>Choose a title (optional)</div>
                        <input type="text" onChange={e=>this.setState({title : e.target.value})}/>
                        <div>Add some tags (coma separated - optional)</div>
                        <input type="text" onChange={e=>this.setState({tags : e.target.value})}/>
                    </div>
                    <div className="foot" onClick={this.props.onSave.bind(this)}>Save</div>
                </div>
            </div>
    }
}

class SaveButton extends Component {
    render(){
        return <div className="save-container">
                <div className="save-button" onClick={this.props.onClick.bind(this)}>💾</div>
            </div>
    }
}

class Options extends Component {
    constructor(props){
        super(props)
        this.state = {
            spellCheck: false,
            color: true,
            scroll : true,
            nedit : false
        }
    }
    componentDidMount(){
        this.setState( JSON.parse(localStorage.getItem("750options")) )
    }

    componentDidUpdate(pp,ps){
        if(ps != this.state) {
            this.props.onChange(this.state)
            localStorage.setItem("750options",JSON.stringify(this.state))
        }
    }
    render(){
        return <div className="options-container">
                <div className="container">
                    <div className={!this.state.nedit ? "options-item on" : "options-item"} onClick={()=>this.setState({nedit : !this.state.nedit})}>Edit</div>
                    <div className={this.state.scroll ? "options-item on" : "options-item"} onClick={()=>this.setState({scroll : !this.state.scroll})}>Scroll</div>
                    <div className={this.state.color ? "options-item on" : "options-item"} onClick={()=>this.setState({color : !this.state.color})}>Color</div>
                    <div className={this.state.spellCheck ? "options-item on" : "options-item"} onClick={()=>this.setState({spellCheck : !this.state.spellCheck})}>Spellcheck</div>
                </div>
            </div>
    }
}

function countWords(s){
    s = s.replace(/(^\s*)|(\s*$)/gi,"");//exclude  start and end white-space
    s = s.replace(/\n/g," "); // exclude newline with a start spacing
    s = s.replace(/[ ]{2,}/gi," ");//2 or more space to 1
    if( s=="" || s == " ") return 0
    return s.split(' ').length; 
}