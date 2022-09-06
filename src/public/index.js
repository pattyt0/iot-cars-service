$(document).ready(function(){
    var pusher = new Pusher('c430430aac7cd46ef3ad', {
        cluster: 'sa1'
    });

    let channel = pusher.subscribe('iot-cars-pusher-channel');
    channel.bind('message-added', onMessageAdded);

    $('#btn-chat').click(function(){
        const message = $("#message").val();
        $("#message").val("");

        //send message
        $.post( "http://localhost:5000/message", { message } );
    });

    function onMessageAdded(data) {
        let template = $("#new-message").html();
        template = template.replace("{{body}}", data.message);

        $(".chat").append(template);
    }
});
