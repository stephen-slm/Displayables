// short hand notation to stop repetitive verbose code to stay the same thing over and over again
// when interacting within the dom. Used to simplify code reading and code style + improve usage.
const $ = document.querySelector.bind(document);

/**
 * Gets the news based on the provided country and category.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function getNewsData(country, category) {
  if (this._.isNil(category)) {
    return this.api.news.topCountry(country);
  }

  return this.api.news.topCountryCategory(country, category);
}

/**
 * Binds the article data to the class object (news only).
 * @param {string} className The class name to set the content by.
 * @param {object} article The news article.
 */
function setNewsArticle(className, article) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = $(name);

  let { author, content } = article;
  const { source, title, urlToImage } = article;

  if (this._.isNil(content)) content = article.description;
  if (this._.isNil(content)) content = '';

  // because we are using the free tier, we don't get the full message which results in us having to
  // take out the '+ extra characters' message after the first 260 characters
  content = content.substring(0, 260);

  author = this._.isNil(author) || author.trim() === '' ? 'Unknown' : author.trim();
  const sourceName = this._.isNil(source.name) || source.name.trim() === '' ? 'Unknown' : source.name.trim();

  location.querySelector('.news-title').textContent = title;
  location.querySelector('.news-content').firstElementChild.textContent = `${content}`;
  location.querySelector('.news-content').lastElementChild.textContent = `Author: ${author}, ${sourceName}`;

  if (this._.isNil(urlToImage)) {
    location.querySelector('.news-image').firstElementChild.src = 'https://i.imgur.com/tVlZAsQ.jpg';
    // location.style.gridTemplateColumns = '1fr';
  } else {
    location.querySelector('.news-image').firstElementChild.src = urlToImage;
    location.style.gridTemplateColumns = null;
  }
}

/**
 * Put a message into the page letting the user know the news failed to load.
 * @param {string} className The class name of the message that will be put about missing news.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
function setNewsContentMissing(className, country, category) {
  const name = className.startsWith('.') ? className : `.${className}`;
  const location = $(name);

  location.classList.add('news-error');
  Array.from(location.children).forEach((node) => node.remove());

  const errorContainer = document.createElement('div');
  const message = document.createElement('div');
  const news = document.createElement('div');

  message.textContent = this.language.errors.loadNews;
  news.textContent = `Country: ${country}${this._.isNil(category) ? '' : `, category: ${category}`}`;

  errorContainer.appendChild(message);
  errorContainer.appendChild(news);

  location.appendChild(errorContainer);
}

/**
 * Updates a existing div containing all the related news information.
 * @param {string} className The class name containing the div.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function refresh(className, config) {
  const { country, category } = config;
  const dataLocation = `${className}-news`;

  let news = this.instance[dataLocation];
  let selectedIndex = news.selectedIndex + 1;

  // only refresh the news content if we have actually ran out of news articles to be rotating
  // through, otherwise just move onto the next news article.
  if (this._.isNil(news) || selectedIndex >= news.articles.length) {
    this.instance[dataLocation] = await this.getNewsData(country, category);
    this.instance[dataLocation].selectedIndex = 0;

    news = this.instance[dataLocation];
    selectedIndex = 0;
  }

  if (!this._.isNil(news.articles)) {
    const article = news.articles[selectedIndex];
    this.setNewsArticle(className, article);

    // make sure to update the index if the value has changed.
    this.instance[dataLocation].selectedIndex += 1;
  }
}

/**
 * Loads a fresh div containing all the related news information.
 * @param {string} className The class name containing the div.
 * @param {string} country The country code of the news location.
 * @param {string | null} category The category of the news location.
 */
async function start(className, config) {
  const { country, category } = config;
  const dataLocation = `${className}-news`;

  this.instance[dataLocation] = await this.getNewsData(country, category);
  this.instance[dataLocation].selectedIndex = 0;

  if (!this._.isNil(this.instance[dataLocation].articles)) {
    const { selectedIndex } = this.instance[dataLocation];
    const article = this.instance[dataLocation].articles[selectedIndex];

    if (!this._.isNil(article)) this.setNewsArticle(className, article);
    else this.setNewsContentMissing(className, country, category);
  }
}

export default {
  start,
  refresh,
  getNewsData,
  setNewsArticle,
  setNewsContentMissing
};
