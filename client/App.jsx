import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import moment from 'moment'
import { StickyContainer, Sticky } from 'react-sticky';
import ClickOutside from "react-click-outside"

import SaveToDropbox from './helpers/dropbox'
import SaveToFile from './helpers/local'

var getCaretCoordinates = require('./helpers/caretPos');

export default class App extends Component {
    constructor(props){
        super(props)
        this.state = {
            text : "", 
            title : "",
            tags : "",
            words : 0,
            modal : false,
            toast : {text : "", type:""},
            options : {
                spellCheck : false,
                scroll : true,
                nedit : false,
                options : false,
                style : "minimal",
                dbAccessToken : null
            }
        }
    }

    componentDidMount(){
        var _this = this
        document.querySelector('textarea').addEventListener('keyup', function () {
            var coordinates = getCaretCoordinates(this, this.selectionEnd);
            var bodyRect = document.body.getBoundingClientRect()
            var rect = this.getBoundingClientRect();
            var offset   = rect.top - bodyRect.top;
            var maxHeight = document.documentElement.clientHeight- 200;
            var minHeight = 200;
            var pos = coordinates.top + rect.top;
            var scroll = _this.state.options.scroll
            if (scroll && pos > maxHeight) window.scroll(0, offset + 100 + coordinates.top - maxHeight )
            if (scroll && pos<minHeight) window.scroll(0, offset + coordinates.top - minHeight )
            
        })
    }

    Save(type){
        var {text, title, tags} = this.state
        var filename = `750W-${moment().format("DDMMYYYY")}-${title}.txt`
        var fileContent = `---
title : ${title}
date : ${moment().format("DD/MM/YYYY")}
time :
tags : ${tags}
---
 
${text}`

        fileContent = fileContent.replace(/\n/g,"\r\n")
        var url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent)
        if(type == "local") SaveToFile(filename, fileContent, () =>this.setState({modal : false}))
        if(type == "dropbox") SaveToDropbox(filename, fileContent, () => this.setState({modal : false}))
    }

    render(){
        var wordCount = countWords(this.state.text)
        var options = this.state.options
        return <div> 
            {this.state.modal && <Modal  offDisplay={()=>this.setState({modal : false})}  onSave={this.Save.bind(this, "local")} onDbSave={this.Save.bind(this, "dropbox")} onChange={(title="",tags="")=>this.setState({title,tags})}/>}
            <div className={this.state.modal ? "wrapper blurry "+ options.style.toLowerCase() : "wrapper "+ options.style.toLowerCase()}>
                    <StickyContainer>
                        <Sticky>
                            <LoadBar words={wordCount}/>
                        </Sticky>
                        {wordCount > 750 && <SaveButton text={this.state.text} onClick={()=>this.setState({modal : true})}/>}
                        <Editor onChange={text=> this.setState({text})} options={this.state.options}/>
                        <Options onChange={options=>this.setState({options})} />
                    </StickyContainer>
            </div>
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
            console.log(event.key)
            if(event.key == 'Backspace' || event.key.indexOf("Arrow")!=-1){
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
                        <div>Add some tags (comma separated - optional)</div>
                        <input type="text" onChange={e=>this.setState({tags : e.target.value})}/>
                    </div>
                    <div className="foot">
                         <div onClick={this.props.onSave.bind(this)}>Save</div>
                         <div className="dropBox" onClick={this.props.onDbSave.bind(this)}>Save On Dropbox</div>
                    </div>
                </div>
            </div>
    }
}

class SaveButton extends Component {
    render(){
        return <div className="save-container">
                <div className="save-button" onClick={this.props.onClick.bind(this)}>save</div>
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
            nedit : false,
            style : "minimal",
            themes : false
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
                <div className="container" >
                    <ClickOutside className="options-block" onClickOutside={()=>this.setState({options : false, themes : false})}>
                        <div>
                            <div className="options-line">
                                { !this.state.options && <div className={ "options-item nomargin"} onClick={()=>this.setState({options : !this.state.options, themes : false})}>Options</div>}
                                { this.state.options && <span>
                                <div className={!this.state.nedit ? "options-item on" : "options-item"} onClick={()=>this.setState({nedit : !this.state.nedit})}>Edit</div>
                                    <div className={this.state.scroll ? "options-item on" : "options-item"} onClick={()=>this.setState({scroll : !this.state.scroll})}>Scroll</div>
                                    <div className={this.state.spellCheck ? "options-item on" : "options-item"} onClick={()=>this.setState({spellCheck : !this.state.spellCheck})}>Spellcheck</div>
                                    <div className={this.state.themes ? "options-item on" : "options-item"} onClick={()=>this.setState({themes : !this.state.themes})}>Themes</div>
                                    <a className="option-link" href="https://github.com/olup/750w" target="blank">About</a> 
                                </span>}
                            </div>
                        </div>
                    {this.state.options && this.state.themes && <div>
                        <div className="options-line">
                            { ["Minimal","Forest","Ocean","Banana","Paper", "Flowers", "Picnick"].map(it => <div className={this.state.style == it ? "options-item on" : "options-item"} onClick={()=>this.setState({style : it})}>{it}</div>)}
                        </div>
                    </div>}
                    </ClickOutside>
                </div>
            </div>
    }
}

// counting words from a string

function countWords(s){
    s = s.replace(/(^\s*)|(\s*$)/gi,"");//exclude  start and end white-space
    s = s.replace(/\n/g," "); // exclude newline with a start spacing
    s = s.replace(/[ ]{2,}/gi," ");//2 or more space to 1
    if( s=="" || s == " ") return 0
    return s.split(' ').length; 
}

