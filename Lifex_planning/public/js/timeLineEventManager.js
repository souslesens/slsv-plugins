var TimeLineEventManager = (function() {
        var self = {};



        self.timeLineOptions= {
            editable: true,
            onAdd: function(item, callback) {
                prettyPrompt('Add item', 'Enter text content for new item:', item.content, function(value) {
                    if (value) {
                        item.content = value;
                        callback(item); // send back adjusted new item
                    } else {
                        callback(null); // cancel item creation
                    }
                });
            },
            onMove: function(item, callback) {
                return   callback(item)
                var title = 'Do you really want to move the item to\n' +
                    'start: ' + item.start + '\n' +
                    'end: ' + item.end + '?';
                prettyConfirm('Move item', title, function(ok) {
                    if (ok) {
                        callback(item); // send back item as confirmation (can be changed)
                    } else {
                        callback(null); // cancel editing item
                    }
                });
            },
            onMoving: function(item, callback) {
               return callback(item);
                if (item.start < min) item.start = min;
                if (item.start > max) item.start = max;
                if (item.end > max) item.end = max;

                callback(item); // send back the (possibly) changed item
            },
            onUpdate: function(item, callback) {
                prettyPrompt('Update item', 'Edit items text:', item.content, function(value) {
                    if (value) {
                        item.content = value;
                        callback(item); // send back adjusted item
                    } else {
                        callback(null); // cancel updating the item
                    }
                });
            },

            onRemove: function(item, callback) {
                prettyConfirm('Remove item', 'Do you really want to remove item ' + item.content + '?', function(ok) {
                    if (ok) {
                        callback(item); // confirm deletion
                    } else {
                        callback(null); // cancel deletion
                    }
                });

            }

        }


        return self;
    }


)();

export default TimeLineEventManager;
window.TimeLineEventManager = TimeLineEventManager;