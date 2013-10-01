var tweetText = 'Check it out! I just tweeted using #BrowserStig. \
Developer Friendly browser automation! \
http://justspamjustin.github.io/browserstig #browserautomation';

var stig = new BrowserStig();
stig.open('/');
stig.el('#global-new-tweet-button').click();
stig.el('#tweet-box-global').type(tweetText);
stig.el('.tweet-action:visible').click();
stig.run();