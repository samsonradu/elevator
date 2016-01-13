import React from 'react'
import elevator from './elevator.js';
import { render } from 'react-dom'

const E = React.createClass({
    componentWillMount() {
        elevator.addChangeListener(this.handleState);
    },

    getInitialState() {
        return elevator.state;
    },

    handleCommand(e) {
        let $el = $(e.currentTarget);
        let type = $el.data('type');
        let level = $el.data('level');
        let direction = $el.data('direction');
        elevator.command(type, level, direction);
    },

    handleState(){
        this.setState(elevator.state);
    },

    renderLevels(){
        let arr = [];
        let self = this;

        for (let i = this.props.levels-1; i >= 0; i--){
            let btns = [];
            let lvl;

            for (let j = this.props.levels-1; j >= 0; j--){
                let btnClass = elevator.get('inner', j, '') || 
                    (self.state.running && self.state.running.level === j && self.state.running.type === 'inner') ? 'active' : '';
                btns.push(<a className={btnClass} key={j} onClick={self.handleCommand} data-type='inner' data-level={j}>{j}</a>);
            }

            let levelClass = self.state.open ? "open" : "";

            if (self.state.level === i)
                lvl = <div className={levelClass + ' level current'}>{i}<div className='inner-block'>{btns}</div></div>;
            else 
                lvl = <div className='level'>{i}</div>;

            let classUp = elevator.get('outer', i, 'up') || 
                (self.state.running && self.state.running.level === i && self.state.running.type === 'outer' && self.state.running.direction === 'up') ? 'active' : '';
            let classDown = elevator.get('outer', i, 'down') || 
                (self.state.running && self.state.running.level === i && self.state.running.type === 'outer' && self.state.running.direction === 'down') ? 'active' : '';

            arr.push(
                <div className="block" key={i}>
                    <div className='outer-block'>
                        <a className={classUp} onClick={self.handleCommand} data-type='outer' data-level={i} data-direction='up'><i className='glyphicon glyphicon-chevron-up'></i></a>
                        <br></br>
                        <a className={classDown} onClick={self.handleCommand} data-type='outer' data-level={i} data-direction='down'><i className='glyphicon glyphicon-chevron-down'></i></a>
                    </div>
                    {lvl}
                    <div className='clear'></div>
                </div>
            );
        }
        return arr;
    },

    render() {
        let levels = this.renderLevels();
        return (
          <div>
            {levels}
          </div>
        );
    }
});

    // Finally, we render a <Router> with some <Route>s.
    // It does all the fancy routing stuff for us.
render((
    <E levels='6'/>
), document.getElementById("content"))
