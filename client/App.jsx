import React, { Component } from 'react';
import Textarea from 'react-textarea-autosize';
import AutosizeInput from 'react-input-autosize';
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
            elapsedTime : 0,
            modal : false,
            toast : {text : "", type:""},
            options : {
                spellCheck : false,
                scroll : true,
                nedit : false,
                options : false,
                style : "minimal",
                dbAccessToken : null,
                showChallenges : false,
                challenge : {
                    type : "words",
                    goal : 750
                }
            }
        }
    }

    componentDidMount(){
        var _this = this
        //this.startTimer()
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
        setInterval( () => {
                if(this.state.elapsedTime!=0) this.setState({elapsedTime : this.state.elapsedTime + 1})
            } , 1000 )
    }

    startTimer(){
        if(this.state.options.challenge.type == 'time' && this.state.elapsedTime == 0) {
            this.setState({elapsedTime : 1})
        }
        
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
        if(type == "local") SaveToFile(filename, fileContent, () => this.setState({modal : false, toast:{text:"File saved to disk",type:"success"}}) )
        if(type == "dropbox") SaveToDropbox(filename, fileContent, () =>  this.setState({modal : false, toast:{text:"File saved to Dropbox",type:"success"}}) )
    }

    render(){
        var wordCount = countWords(this.state.text)
        var options = this.state.options

        var completion
        if(options.challenge.type == "words") completion = ( 100/options.challenge.goal ) * wordCount
        if(options.challenge.type == "time") completion = ( 100/ (options.challenge.goal*60) ) * this.state.elapsedTime

        return <div> 
            {this.state.modal && <Modal  
                vals={{title : this.state.title, tags : this.state.tags}}
                offDisplay={()=>this.setState({modal : false})}  
                onSave={this.Save.bind(this, "local")} 
                onDbSave={this.Save.bind(this, "dropbox")} 
                onChange={(title="",tags="")=>this.setState({title,tags})}
            />}
            <div className={this.state.modal ? "wrapper blurry "+ options.style.toLowerCase() : "wrapper "+ options.style.toLowerCase()}>
                    <Toaster message={this.state.toast.text} type={this.state.toast.type} onClose={()=>this.setState({toast:{text:"",type:""}})} />
                    <StickyContainer>
                        <Sticky>
                            <LoadBar completion={completion}/>
                        </Sticky>
                        {completion >= 100 && <SaveButton text={this.state.text} onClick={()=>this.setState({modal : true})}/>}
                        <Editor onChange={text=> {
                            this.startTimer()
                            this.setState({text})
                        }} options={this.state.options}/>
                        <Options options={options} onChange={options=>{
                            if(options.challenge != this.state.options.challenge) this.setState({elapsedTime : 0})
                            this.setState({options})
                        }} />
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
        return <div className="load-bar-container">
                <div className="container">
                    <div className="load-bar" style={{width : this.props.completion+"%"}}></div>
                </div>
            </div>
    }
}

class Modal extends Component {
    constructor(props){
        super(props)
        this.state = {
            title : props.vals.title,
            tags : props.vals.tags,
            dboading : false
        }
    }
    componentDidUpdate(pp,ps){
        if(ps.title != this.state.title || ps.tags != this.state.tags) this.props.onChange(this.state.title, this.state.tags)
    }
    render(){
        var vals = this.props.vals
        return <div className="modal-container" onClick={this.props.offDisplay.bind(this)}>
                <div className="modal" onClick={e=>e.stopPropagation()}>
                    <div className="title">Save your words</div>
                    <div className="body">
                        <div>Choose a title (optional)</div>
                        <input type="text" value={this.state.title} onChange={e=>this.setState({title : e.target.value})}/>
                        <div>Add some tags (comma separated - optional)</div>
                        <input type="text" value={this.state.tags} onChange={e=>this.setState({tags : e.target.value})}/>
                    </div>
                    <div className="foot">
                         <div onClick={this.props.onSave.bind(this)}>Save</div>
                         <div className="dropBox" onClick={() => {
                                this.setState({dbLoading :true})
                                this.props.onDbSave()
                            }}>{!this.state.dbLoading ? "Save On Dropbox" : "Saving ..."}</div>
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

class Toaster extends Component {
    componentDidUpdate(pp,ps){
        if(pp.message != this.props.message && this.timer ) clearTimeout(this.timer)
        if(this.props.message) this.timer = setTimeout( this.props.onClose.bind(this), 5000 )
    }
    render(){
        if(!this.props.message) return null
        return <div className="toaster-container">
            <div className="r">
                <div className={"toaster "+this.props.type}>
                    <div className="message">{this.props.message}</div>
                    <div className="close" onClick={this.props.onClose.bind(this)}>close</div>
                </div>
            </div>
        </div>
    }
}

class Options extends Component {
    constructor(props){
        super(props)
        this.state = props.options
    }
    componentDidMount(){
        this.setState( Object.assign({}, this.state, JSON.parse(localStorage.getItem("750options")) ))
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
                    <ClickOutside className="options-block" onClickOutside={()=>this.setState({options : false, themes : false, showChallenges : false})}>
                        <div>
                            <div className="options-line">
                                { !this.state.options && <div className={ "options-item nomargin"} onClick={()=>this.setState({options : !this.state.options, themes : false})}>Options</div>}
                                { this.state.options && <span>
                                <div className={!this.state.nedit ? "options-item on" : "options-item"} onClick={()=>this.setState({nedit : !this.state.nedit})}>Edit</div>
                                    <div className={this.state.scroll ? "options-item on" : "options-item"} onClick={()=>this.setState({scroll : !this.state.scroll})}>Scroll</div>
                                    <div className={this.state.spellCheck ? "options-item on" : "options-item"} onClick={()=>this.setState({spellCheck : !this.state.spellCheck})}>Spellcheck</div>
                                    <div className={this.state.themes ? "options-item on" : "options-item"} onClick={()=>this.setState({showChallenges : false, themes : !this.state.themes})}>Theme</div>
                                    <div className={this.state.showChallenges ? "options-item on" : "options-item"} onClick={()=>this.setState({themes : false, showChallenges : !this.state.showChallenges})}>Goal</div>
                                    <a className="option-link" href="https://github.com/olup/750w" target="blank">About</a> 
                                </span>}
                            </div>
                        </div>
                    {this.state.options && this.state.themes && <div>
                        <div className="options-line">
                            { ["Minimal","Forest","Ocean","Banana","Paper", "Flowers", "Picnick"].map(it => <div className={this.state.style == it ? "options-item on" : "options-item"} onClick={()=>this.setState({style : it})}>{it}</div>)}
                        </div>
                    </div>}
                    {this.state.options && this.state.showChallenges && <div>
                        <div className="options-line">
                           <div className="options-item on"><AutosizeInput value={this.state.challenge.goal} onChange={(e)=>this.setState( { challenge : Object.assign( {}, this.state.challenge , {goal : e.target.value} )} )}/></div>
                           <div className={this.state.challenge.type == "words" ? "options-item on":"options-item"} onClick={()=>this.setState({challenge: Object.assign({}, this.state.challenge, {type : "words"})})}>Words</div>
                           <div className={this.state.challenge.type == "time" ? "options-item on":"options-item"} onClick={()=>this.setState({challenge: Object.assign({}, this.state.challenge, {type : "time"})})}>Minutes</div>
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

