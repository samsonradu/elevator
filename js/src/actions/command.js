import elevator from '../stores/elevator.js';
import { ActionTypes } from './types.js';
import Dispatcher from '../dispatcher/dispatcher.js';

module.exports = {
    commandAction: function (type, level, direction) {
        Dispatcher.dispatch({
            'actionType': ActionTypes.COMMAND,
            'type': type,
            'level': level,
            'direction': direction
        });
    }
}
