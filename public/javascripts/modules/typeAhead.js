import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
  return stores.map((store) => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('');
}

function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults= search.querySelector('.search__results');

  searchInput.on('input', function() {
    // if there is no value -> remove results
    if (!this.value) {
      searchResults.hidden = true;
      return; // stop!
    }

    // show the search results!
    searchResults.hidden = false;

    axios
      .get(`/api/search?q=${this.value}`)
      .then((response) => {
        if (response.data.length) {
          const html = searchResultsHTML(response.data);
          searchResults.innerHTML = dompurify.sanitize(html);
        } else {
          // tell them nothing came back
          searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for <strong>${this.value}</strong> found 🤢</div>`);
        }
      });
  });

  // handle keyboard inputs

  searchInput.on('keydown', function(event) {
    // if they ain't pressing up, down or enter, who cares?
    if (![38, 40, 13].includes(event.keyCode)) return;

    const activeClass = 'search__result--active';
    const items = search.querySelectorAll('.search__result');
    const current = search.querySelector(`.${activeClass}`);
    let next;

    if (event.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (event.keyCode === 40) {
      next = items[0];
    } else if (event.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (event.keyCode === 38) {
      next = items[items.length - 1]
    } else if (event.keyCode === 13 && current) {
      current.click();
    } else  if (event.keyCode === 13){
      items[0].click();
      return;
    }

    next.classList.add(activeClass);
    current && current.classList.remove(activeClass);
  });
}

export default typeAhead;