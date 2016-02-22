'use strict';

var github = new Github({
  token: TOKEN,
  auth: 'oauth'
});

// default sorting order
function order(a, b) {
  return a.updatedAt < b.updatedAt ?
    1 : a.updatedAt === b.updatedAt ?
    0 : -1;
}

// renders issue as article
function post(error, issue) {
  if (error || !issue) {
    // redirect to front page if id incorrent
    document.location.replace('index.html');
    return;
  }

  var parent = document.querySelector('.threads'),
      content = [];

  content.push('<div id="' + issue.id + '" class="post">');
  content.push('<h1 class="post-title">');
  content.push('<a href="?' + issue.id + '">' + issue.title + '</a>');
  content.push('</h1>');
  content.push('<div class="post-meta">');
  content.push('by <a href="' + issue.user.html_url + '">' + issue.user.login + '</a> &middot; ');
  content.push(new Date(issue.created_at).toLocaleDateString() + ' &middot; ');
  content.push((issue.comments === 1 ? '1 comment' : (issue.comments ? (issue.comments + ' comment(s)') : 'no comments')));
  content.push('</div>');

  if (issue.labels.length) {
    content.push('<div class="post-meta-categories">');
    issue.labels.forEach(function (label) {
      content.push('<span class="post-meta-category" style="background: #' + label.color + '">');
      content.push(label.name);
      content.push('</span>');
    });
    content.push('</div>');
  }

  content.push('<div class="post-body">');
  content.push(marked(issue.body).replace(/<pre>/g, '<pre class="prettyprint">'));
  content.push('</div>');

  parent.innerHTML += content.join('');
  prettyPrint();

  if (issue.comments) {
    var commentContainer = document.createElement('div');
    commentContainer.className = 'post-comments';
    commentContainer.innerHTML = 'Loading ' + issue.comments + ' comments...';
    parent.appendChild(commentContainer);

    github._request('GET', issue.comments_url, {}, function (error, data) {
      if (error)
        return;

      commentContainer.innerHTML = '';

      var comments = [];
      data.forEach(function (comment) {
        comments.push('<div id="' + comment.id + '" class="post-comment">');
        comments.push('<a class="post-comment-author" href="' + comment.user.html_url + '">');
        comments.push(comment.user.login);
        comments.push('</a>');
        comments.push('<span class="post-comment-date">');
        comments.push(new Date(comment.created_at).toLocaleDateString());
        comments.push('</span>');
        comments.push('<div class="post-comment-body">');
        comments.push(marked(comment.body).replace(/<pre>/g, '<pre class="prettyprint">'));
        comments.push('</div>');
        comments.push('</div>');
      });

      comments.push('<a href="' + issue.html_url + '">add comment</a>');
      commentContainer.innerHTML += comments.join('');

      prettyPrint();
    });
  } else {
    parent.innerHTML += '<a href="' + issue.html_url + '">add comment</a>';
  }
}

// lists all issues (front page)
function list(error, issues) {
  if (error || !issues)
    return;

  issues = issues.sort(order);
  var parent = document.querySelector('.threads'),
      content = [];

  issues.forEach(function (issue) {
    content.push('<div id="' + issue.id + '" class="post">');
    content.push('<h1 class="post-title">');
    content.push('<a href="?' + issue.number + '">' + issue.title + '</a>');
    content.push('</h1>');
    content.push('<div class="post-meta">');
    content.push('by <a href="' + issue.user.html_url + '">' + issue.user.login + '</a> &middot; ');
    content.push(new Date(issue.created_at).toLocaleDateString() + ' &middot; ');
    content.push((issue.comments === 1 ? '1 comment' : (issue.comments ? (issue.comments + ' comment(s)') : 'no comments')));
    content.push('</div>');
    content.push('</div>');
  });

  parent.innerHTML += content.join('');
}

// renders github issues
function render() {
  document.querySelector('.threads').innerHTML = '';

  var issues = github.getIssues(USERNAME, REPO),
      id = window.location.search.replace('?', '');

  if (id) {
    issues.get(id, post);
  } else
    issues.list({}, list);
}
