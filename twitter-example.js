if (window.location.href.indexOf('twitter.com') === -1) {
  alert('Go to http://twitter.com, then click the bookmarklet.');
  throw new Error();
}

if ($('.account-summary.account-summary-small').length < 1) {
  alert('Log in to twitter.com, then click the bookmarklet.');
  throw new Error();
}

var tweetText = 'Check it out! I just tweeted using #BrowserStig. \
Developer Friendly browser automation! \
http://justspamjustin.github.io/browserstig #browserautomation';

var stig = new BrowserStig();
stig.open('/');
stig.el('#global-new-tweet-button').click();
stig.el('#tweet-box-global').type(tweetText);
stig.el('.tweet-action:visible').click();
stig.run();