/* =====================================================
   LUNAR Rocketry Club â€“ Main JavaScript
   ===================================================== */

(function () {
  'use strict';

  let countdownTimer = null;

  function getBadgeClass(value) {
    if (value === 'blue') return 'badge--blue';
    if (value === 'orange') return 'badge--orange';
    if (value === 'gray') return 'badge--gray';
    return 'badge--green';
  }

  function formatHistoryDate(isoDate) {
    const parsed = new Date(isoDate + 'T00:00:00');
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function buildLaunchList(list, target) {
    if (!target || !Array.isArray(list)) return;

    target.innerHTML = list.map(function (launch) {
      return (
        '<div class="event-item">' +
          '<div class="event-item__date">' +
            '<span class="event-item__month">' + (launch.month || '--') + '</span>' +
            '<span class="event-item__day">' + (launch.day || '--') + '</span>' +
          '</div>' +
          '<div class="event-item__body">' +
            '<div class="event-item__title">' + (launch.title || 'Launch') + '</div>' +
            '<div class="event-item__meta">' +
              '<span>ðŸ“ ' + (launch.location || 'TBD') + '</span>' +
              '<span>â° ' + (launch.time || 'TBD') + '</span>' +
              '<span class="badge ' + getBadgeClass(launch.badge) + '">' + (launch.status || 'Scheduled') + '</span>' +
            '</div>' +
            '<p class="event-item__text">' + (launch.description || '') + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderLaunchSites(items) {
    const node = document.getElementById('launch-sites-list');
    if (!node || !Array.isArray(items)) return;

    const tabMarkup = items.map(function (site, index) {
      return (
        '<button type="button" class="launch-site-tab' + (index === 0 ? ' is-active' : '') + '" role="tab" id="launch-site-tab-' + index + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '" aria-controls="launch-site-panel-' + index + '" data-site-index="' + index + '">' +
          '<span class="launch-site-tab__title">' + (site.name || 'Site') + '</span>' +
          '<span class="launch-site-tab__meta">' + (site.use || 'Launch site') + '</span>' +
        '</button>'
      );
    }).join('');

    const panelMarkup = items.map(function (site, index) {
      const rules = Array.isArray(site.rules) ? site.rules : [];
      const recommendations = Array.isArray(site.recommendations) ? site.recommendations : [];
      return (
        '<section class="launch-site-panel' + (index === 0 ? ' is-active' : '') + '" role="tabpanel" id="launch-site-panel-' + index + '" aria-labelledby="launch-site-tab-' + index + '"' + (index === 0 ? '' : ' hidden') + '>' +
          '<div class="launch-site-panel__layout">' +
            '<div>' +
              '<p class="card__eyebrow">' + (site.location || 'Launch site') + '</p>' +
              '<h3 class="card__title">' + (site.name || 'Site') + '</h3>' +
              '<p class="card__text">' + (site.description || site.notes || '') + '</p>' +
              '<p class="launch-site-card__heading">Directions</p>' +
              '<p class="card__text">' + (site.directions || 'Directions coming soon.') + '</p>' +
              '<p class="launch-site-card__heading">Launch Rules</p>' +
              '<ul class="program-points">' + rules.map(function (rule) { return '<li>' + rule + '</li>'; }).join('') + '</ul>' +
              '<p class="launch-site-card__heading">Recommendations</p>' +
              '<ul class="program-points">' + recommendations.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
            '</div>' +
            '<div class="launch-site-panel__map">' +
              (site.mapEmbed ? '<iframe title="Map of ' + (site.name || 'site') + '" src="' + site.mapEmbed + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' : '<div class="launch-site-card__map-placeholder">Map unavailable</div>') +
            '</div>' +
          '</div>' +
        '</section>'
      );
    }).join('');

    node.innerHTML = (
      '<div class="launch-site-tabs" role="tablist" aria-label="Launch locations">' + tabMarkup + '</div>' +
      '<div class="launch-site-panels">' + panelMarkup + '</div>'
    );

    const tabs = node.querySelectorAll('.launch-site-tab');
    const panels = node.querySelectorAll('.launch-site-panel');

    function activateTab(index) {
      tabs.forEach(function (tab, tabIndex) {
        const active = tabIndex === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      panels.forEach(function (panel, panelIndex) {
        const active = panelIndex === index;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activateTab(index);
      });
      tab.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        activateTab(nextIndex);
      });
    });

    activateTab(0);
  }

  function renderLaunchAlert(launchStatus) {
    const alertNode = document.getElementById('launch-alert');
    if (!alertNode || !launchStatus) return;

    const alertConfig = launchStatus.alert || {};
    const active = Boolean(alertConfig.enabled);
    alertNode.hidden = !active;

    if (!active) return;

    const kind = alertConfig.kind || 'moved';
    alertNode.className = 'launch-alert launch-alert--' + kind;

    const heading = alertNode.querySelector('[data-launch-alert-headline]');
    const body = alertNode.querySelector('[data-launch-alert-body]');
    if (heading) heading.textContent = alertConfig.headline || 'Launch update';
    if (body) body.textContent = alertConfig.body || launchStatus.message || '';
  }

  function renderLaunchStatusCard(launchStatus) {
    const statusNode = document.getElementById('launch-status-card');
    if (!statusNode || !launchStatus) return;

    const titleNode = statusNode.querySelector('[data-launch-title]');
    const messageNode = statusNode.querySelector('[data-launch-message]');
    const labelNode = statusNode.querySelector('[data-launch-label]');
    const noteNode = statusNode.querySelector('[data-launch-note]');
    const locationNode = statusNode.querySelector('[data-launch-location]');
    const timeNode = statusNode.querySelector('[data-launch-time]');

    if (titleNode) titleNode.textContent = launchStatus.title || 'Next Launch';
    if (messageNode) messageNode.textContent = launchStatus.message || '';
    if (labelNode) labelNode.textContent = launchStatus.statusLabel || 'Scheduled';
    if (noteNode) noteNode.textContent = launchStatus.statusNote || '';
    if (locationNode) locationNode.textContent = launchStatus.location || 'TBD';
    if (timeNode) timeNode.textContent = launchStatus.timeWindow || 'TBD';
  }

  function renderLaunchWeather(launchStatus) {
    const node = document.getElementById('launch-weather-card');
    if (!node || !launchStatus) return;

    const forecast = launchStatus.weatherForecast || {};
    const summary = node.querySelector('[data-weather-summary]');
    const high = node.querySelector('[data-weather-high]');
    const wind = node.querySelector('[data-weather-wind]');
    const precip = node.querySelector('[data-weather-precip]');
    const visibility = node.querySelector('[data-weather-visibility]');
    const confidence = node.querySelector('[data-weather-confidence]');

    if (summary) summary.textContent = forecast.summary || 'Forecast pending';
    if (high) high.textContent = forecast.high || '--';
    if (wind) wind.textContent = forecast.wind || '--';
    if (precip) precip.textContent = forecast.precip || '--';
    if (visibility) visibility.textContent = forecast.visibility || '--';
    if (confidence) confidence.textContent = forecast.confidence || '--';
  }

  function renderCountdown(launchStatus) {
    const shell = document.getElementById('launch-countdown');
    if (!shell || !launchStatus) return;

    const days = shell.querySelector('[data-countdown-days]');
    const hours = shell.querySelector('[data-countdown-hours]');
    const minutes = shell.querySelector('[data-countdown-minutes]');
    const seconds = shell.querySelector('[data-countdown-seconds]');
    const summary = shell.querySelector('[data-countdown-summary]');

    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }

    const state = (launchStatus.state || 'scheduled').toLowerCase();
    if (state === 'cancelled') {
      if (summary) summary.textContent = 'Launch cancelled. Awaiting replacement date.';
      if (days) days.textContent = '--';
      if (hours) hours.textContent = '--';
      if (minutes) minutes.textContent = '--';
      if (seconds) seconds.textContent = '--';
      return;
    }

    const targetDate = new Date(launchStatus.nextLaunchISO || '');
    if (Number.isNaN(targetDate.getTime())) {
      if (summary) summary.textContent = launchStatus.fallbackText || 'Launch date unavailable.';
      return;
    }

    function tick() {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        if (summary) summary.textContent = 'Launch window is open. Fly safe and have fun.';
        if (days) days.textContent = '0';
        if (hours) hours.textContent = '0';
        if (minutes) minutes.textContent = '0';
        if (seconds) seconds.textContent = '0';
        if (countdownTimer) {
          window.clearInterval(countdownTimer);
          countdownTimer = null;
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      if (days) days.textContent = String(d);
      if (hours) hours.textContent = String(h).padStart(2, '0');
      if (minutes) minutes.textContent = String(m).padStart(2, '0');
      if (seconds) seconds.textContent = String(s).padStart(2, '0');

      if (summary) {
        if (state === 'moved') {
          summary.textContent = 'Launch moved. Countdown reflects the updated date/time.';
        } else {
          summary.textContent = 'Countdown to wheels-up at the range.';
        }
      }
    }

    tick();
    countdownTimer = window.setInterval(tick, 1000);
  }

  function renderCounters(counters) {
    const countersNode = document.getElementById('home-counters');
    if (!countersNode || !Array.isArray(counters)) return;

    countersNode.innerHTML = counters.map(function (item) {
      return (
        '<div>' +
          '<div class="stat__number">' + (item.value || '0') + '</div>' +
          '<div class="stat__label">' + (item.label || '') + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderQuickLinks(links) {
    const linksNode = document.getElementById('quick-links');
    if (!linksNode || !Array.isArray(links)) return;

    linksNode.innerHTML = links.map(function (item) {
      return (
        '<article class="card">' +
          '<h3 class="card__title">' + (item.title || 'Resource') + '</h3>' +
          '<p class="card__text">' + (item.description || '') + '</p>' +
          '<a class="resource-link" href="' + (item.href || 'index.html') + '">Open section</a>' +
        '</article>'
      );
    }).join('');
  }

  function renderMotorRecords(rows) {
    const node = document.getElementById('leaderboard-list') || document.getElementById('motor-records-list');
    if (!node || !Array.isArray(rows)) return;

    const rowsToRender = node.id === 'leaderboard-list' ? rows.slice(0, 4) : rows;

    node.innerHTML = rowsToRender.map(function (row) {
      return (
        '<article class="record-card">' +
          '<div class="record-card__class">' + (row.motorClass || '?') + '</div>' +
          '<div class="record-card__body">' +
            '<h3 class="record-card__title">Highest ' + (row.motorClass || '?') + ' Class Flight</h3>' +
            '<p class="record-card__altitude">' + (row.altitude || 'TBD') + '</p>' +
            '<p class="record-card__meta">' +
              (row.member || 'Member') + ' Â· ' +
              (row.rocket || 'Rocket') + ' Â· ' +
              (row.site || 'Site') + ' Â· ' +
              formatHistoryDate(row.date || '') +
            '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderMileHighRecovery(rows) {
    const node = document.getElementById('mile-high-list');
    if (!node || !Array.isArray(rows)) return;

    node.innerHTML = rows.map(function (item) {
      return (
        '<article class="card">' +
          '<p class="card__eyebrow">' + (item.altitude || '') + '</p>' +
          '<h3 class="card__title">' + (item.member || 'Member') + '</h3>' +
          '<p class="card__text">' + (item.rocket || '') + ' Â· ' + (item.site || '') + '</p>' +
          '<p class="card__text">' + (item.description || '') + '</p>' +
          '<p class="card__text">' + formatHistoryDate(item.date || '') + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function renderFlightHistory(rows) {
    const node = document.getElementById('history-list');
    if (!node || !Array.isArray(rows)) return;

    node.innerHTML = rows.map(function (item) {
      return (
        '<div class="timeline-item">' +
          '<div class="timeline-item__year">' + formatHistoryDate(item.date || '') + '</div>' +
          '<div class="timeline-item__title">' + (item.title || 'Launch Summary') + '</div>' +
          '<div class="timeline-item__text">' + (item.summary || '') + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderFaqAccordion(items, targetId) {
    const node = document.getElementById(targetId);
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (item, index) {
      const openClass = index === 0 ? ' open' : '';
      return (
        '<div class="accordion-item' + openClass + '">' +
          '<button class="accordion-header">' +
            (item.question || 'Question') +
            '<span class="accordion-icon">+</span>' +
          '</button>' +
          '<div class="accordion-body">' + (item.answer || '') + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderLostAndFound(items) {
    const node = document.getElementById('lost-found-list');
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (item) {
      return (
        '<article class="lost-item">' +
          '<div class="lost-item__head">' +
            '<span class="badge ' + (item.type === 'Found' ? 'badge--green' : 'badge--orange') + '">' + (item.type || 'Item') + '</span>' +
            '<span class="lost-item__status">' + (item.status || 'Open') + '</span>' +
          '</div>' +
          '<h3 class="lost-item__title">' + (item.item || 'Equipment') + '</h3>' +
          '<p class="lost-item__meta">' + formatHistoryDate(item.date || '') + ' Â· ' + (item.where || 'Range') + '</p>' +
          '<p class="lost-item__text">' + (item.notes || '') + '</p>' +
          '<a class="resource-link" href="mailto:' + (item.contact || 'info@lunarrocketry.org') + '">Contact: ' + (item.contact || 'info@lunarrocketry.org') + '</a>' +
        '</article>'
      );
    }).join('');
  }

  function renderPrograms(items) {
    const node = document.getElementById('programs-list');
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (item) {
      const highlights = Array.isArray(item.highlights) ? item.highlights : [];
      return (
        '<article class="card">' +
          '<h3 class="card__title">' + (item.name || 'Program') + '</h3>' +
          '<p class="card__text">' + (item.description || '') + '</p>' +
          '<ul class="program-points">' + highlights.map(function (point) {
            return '<li>' + point + '</li>';
          }).join('') + '</ul>' +
          (item.href ? '<a class="resource-link" href="' + item.href + '">Open program page</a>' : '') +
        '</article>'
      );
    }).join('');
  }

  function renderArcResources(items) {
    const node = document.getElementById('arc-resources-list');
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (resource) {
      return (
        '<article class="card">' +
          '<h3 class="card__title">' + (resource.title || 'Resource') + '</h3>' +
          '<p class="card__text">' + (resource.text || '') + '</p>' +
          '<a class="resource-link" href="' + (resource.href || '#') + '">' + (resource.linkText || 'Open') + '</a>' +
        '</article>'
      );
    }).join('');
  }

  function renderArcFaq(items) {
    renderFaqAccordion(items, 'arc-faq');
  }

  function renderOfficers(items) {
    const node = document.getElementById('officers-list');
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (officer) {
      return (
        '<article class="team-card">' +
          '<div class="team-card__avatar">' + (officer.avatar || 'ðŸ‘¤') + '</div>' +
          '<div class="team-card__name">' + (officer.name || 'Officer') + '</div>' +
          '<div class="team-card__role">' + (officer.role || '') + '</div>' +
          '<p class="team-card__text">' + (officer.focus || '') + '</p>' +
          '<a class="resource-link" href="mailto:' + (officer.email || 'info@lunarrocketry.org') + '">Contact</a>' +
        '</article>'
      );
    }).join('');
  }

  function renderTeams(items) {
    const node = document.getElementById('teams-list');
    if (!node || !Array.isArray(items)) return;

    node.innerHTML = items.map(function (team) {
      return (
        '<article class="card">' +
          '<p class="card__eyebrow">' + (team.status || 'Team') + '</p>' +
          '<h3 class="card__title">' + (team.team || 'Team') + '</h3>' +
          '<p class="card__text">School: ' + (team.school || 'TBD') + '</p>' +
          '<p class="card__text">Years competing: ' + (team.yearsCompeting || 'TBD') + '</p>' +
          '<p class="card__text">Instagram: ' + (team.instagram || 'TBD') + '</p>' +
          '<p class="card__text">Members: ' + (team.members || 'TBD') + '</p>' +
          '<p class="card__text">Focus: ' + (team.focus || 'TBD') + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function renderNavSearch() {
    const navInner = document.querySelector('.nav__inner');
    if (!navInner || document.querySelector('.nav__search')) return;

    const searchWrap = document.createElement('div');
    searchWrap.className = 'nav__search';
    searchWrap.innerHTML = [
      '<label class="sr-only" for="site-search">Search site</label>',
      '<input id="site-search" class="nav__search-input" type="search" placeholder="Search pages, launches, teams..." autocomplete="off" />',
      '<div class="nav__search-results" hidden></div>'
    ].join('');

    const links = navInner.querySelector('.nav__links');

    function placeSearchForViewport() {
      if (!links) {
        navInner.appendChild(searchWrap);
        return;
      }

      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      if (isMobile) {
        let mobileSearchHost = links.querySelector('.nav__search-host');
        if (!mobileSearchHost) {
          mobileSearchHost = document.createElement('li');
          mobileSearchHost.className = 'nav__search-host';
          links.appendChild(mobileSearchHost);
        }
        mobileSearchHost.appendChild(searchWrap);
      } else {
        const mobileSearchHost = links.querySelector('.nav__search-host');
        if (mobileSearchHost && mobileSearchHost.contains(searchWrap)) {
          mobileSearchHost.removeChild(searchWrap);
        }
        if (mobileSearchHost && !mobileSearchHost.children.length) {
          mobileSearchHost.remove();
        }

        if (links.nextSibling) {
          navInner.insertBefore(searchWrap, links.nextSibling);
        } else {
          navInner.appendChild(searchWrap);
        }
      }
    }

    placeSearchForViewport();
    window.addEventListener('resize', placeSearchForViewport);

    const input = searchWrap.querySelector('#site-search');
    const results = searchWrap.querySelector('.nav__search-results');
    const searchIndex = [
      { title: 'Home', href: 'index.html', keywords: ['intro', 'countdown', 'launch updates', 'weather'] },
      { title: 'Launch Updates', href: 'launches.html', keywords: ['launch', 'range', 'sites', 'snow ranch', 'brigantino', 'ohlone'] },
      { title: 'Programs', href: 'programs.html', keywords: ['arc', 'high power', 'chip can'] },
      { title: 'American Rocketry Challenge', href: 'arc.html', keywords: ['arc', 'student team', 'ohlone'] },
      { title: 'High Power Certification', href: 'high-power.html', keywords: ['hpr', 'level 1', 'level 2', 'level 3'] },
      { title: 'Chip Can Challenge', href: 'chip-can.html', keywords: ['chip can', 'precision', 'challenge'] },
      { title: 'Records and History', href: 'records.html', keywords: ['leaderboard', 'motors', 'altitude', 'flight history'] },
      { title: 'FAQ', href: 'faq.html', keywords: ['questions', 'help', 'waiver'] },
      { title: 'Lost and Found', href: 'lost-found.html', keywords: ['gear', 'recovered', 'missing'] },
      { title: 'Officers', href: 'officers.html', keywords: ['staff', 'members', 'leadership'] },
      { title: 'Teams', href: 'teams.html', keywords: ['teams', 'school', 'instagram', 'competition'] },
      { title: 'Gallery', href: 'gallery.html', keywords: ['photos', 'images'] },
      { title: 'Join', href: 'join.html', keywords: ['membership', 'signup'] }
    ];

    function closeResults() {
      results.hidden = true;
      results.innerHTML = '';
    }

    function showResults(query) {
      const value = query.trim().toLowerCase();
      if (!value) {
        closeResults();
        return;
      }

      const matches = searchIndex.filter(function (item) {
        const haystack = [item.title].concat(item.keywords || []).join(' ').toLowerCase();
        return haystack.indexOf(value) !== -1;
      }).slice(0, 6);

      if (!matches.length) {
        results.innerHTML = '<div class="nav__search-empty">No matches found.</div>';
        results.hidden = false;
        return;
      }

      results.innerHTML = matches.map(function (item) {
        return '<button type="button" class="nav__search-item" data-href="' + item.href + '">' + item.title + '</button>';
      }).join('');
      results.hidden = false;
    }

    input.addEventListener('input', function () {
      showResults(input.value);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeResults();
        input.blur();
      }
      if (event.key === 'Enter') {
        const first = results.querySelector('.nav__search-item');
        if (first) {
          window.location.href = first.getAttribute('data-href');
        }
      }
    });

    results.addEventListener('click', function (event) {
      const button = event.target.closest('.nav__search-item');
      if (!button) return;
      window.location.href = button.getAttribute('data-href');
    });

    document.addEventListener('click', function (event) {
      if (!searchWrap.contains(event.target)) closeResults();
    });
  }

  function renderPrimaryNav() {
    const navLinks = document.querySelector('.nav__links');
    if (!navLinks) return;

    navLinks.innerHTML = [
      '<li><a href="index.html" class="nav__link">Home</a></li>',
      '<li><a href="arc.html" class="nav__link">ARC</a></li>',
      '<li><a href="launches.html" class="nav__link">Launches</a></li>',
      '<li><a href="records.html" class="nav__link">Records</a></li>',
      '<li><a href="faq.html" class="nav__link">FAQ</a></li>',
      '<li><a href="gallery.html" class="nav__link">Gallery</a></li>',
      '<li><a href="join.html" class="nav__link nav__cta btn btn--primary">Join</a></li>'
    ].join('');
  }

  function applyActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const activePageMap = {
      'index.html': 'index.html',
      'arc.html': 'arc.html',
      'high-power.html': 'arc.html',
      'chip-can.html': 'arc.html',
      'launches.html': 'launches.html',
      'records.html': 'records.html',
      'faq.html': 'faq.html',
      'gallery.html': 'gallery.html',
      'join.html': 'join.html',
      'officers.html': 'index.html',
      'teams.html': 'index.html',
      'about.html': 'index.html',
      'lost-found.html': 'launches.html',
      'programs.html': 'arc.html'
    };
    const activeHref = activePageMap[currentPath] || currentPath;

    document.querySelectorAll('.nav__link').forEach(function (link) {
      const href = (link.getAttribute('href') || '').split('/').pop();
      link.classList.toggle('nav__link--active', href === activeHref || (currentPath === '' && href === 'index.html'));
    });
  }

  function wireAccordions() {
    document.querySelectorAll('.accordion-header').forEach(function (header) {
      header.addEventListener('click', function () {
        const item = header.closest('.accordion-item');
        const group = item.closest('.accordion');
        const wasOpen = item.classList.contains('open');

        if (!group) return;
        group.querySelectorAll('.accordion-item').forEach(function (sibling) {
          sibling.classList.remove('open');
        });

        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function loadDataAndRender() {
    fetch('js/data/site-data.json')
      .then(function (response) { return response.json(); })
      .then(function (data) {
        renderLaunchAlert(data.launchStatus);
        renderLaunchStatusCard(data.launchStatus);
        renderLaunchWeather(data.launchStatus);
        renderCountdown(data.launchStatus);
        renderCounters(data.counters);
        renderQuickLinks((data.homepage && data.homepage.quickLinks) || []);
        renderLaunchSites(data.launchSites);
        renderMotorRecords(data.motorRecords);
        renderMileHighRecovery(data.mileHighRecovery);
        renderFlightHistory(data.flightHistory);
        renderFaqAccordion(data.faq, 'faq-preview');
        renderFaqAccordion(data.faq, 'faq-full');
        renderLostAndFound(data.lostFound);
        renderPrograms(data.programs);
        renderOfficers(data.officers);
        renderTeams(data.teams);
        renderArcResources(data.arcResources);
        renderArcFaq(data.arcFaq);
        renderNavSearch();

        buildLaunchList(data.launches, document.getElementById('home-launch-list'));
        buildLaunchList(data.launches, document.getElementById('launches-list'));

        wireAccordions();
      })
      .catch(function () {
        const summary = document.querySelector('[data-countdown-summary]');
        if (summary) summary.textContent = 'Launch data could not be loaded.';
      });
  }

  renderPrimaryNav();
  applyActiveNav();

  /* ---- Mobile Navigation ---- */
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks  = document.querySelector('.nav__links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    /* Close menu when a link is clicked */
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Accordion ---- */
  wireAccordions();

  /* ---- Membership form submission (no back-end; show thank-you) ---- */
  const joinForm = document.getElementById('join-form');
  if (joinForm) {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      joinForm.innerHTML =
        '<div style="text-align:center;padding:2rem 0">' +
        '<div style="font-size:3rem;margin-bottom:1rem"></div>' +
        '<h3 style="margin-bottom:0.5rem">Application Received!</h3>' +
        '<p style="color:var(--color-muted)">Thanks for your interest in LUNAR. ' +
        'We\'ll be in touch within a few days with next steps.</p>' +
        '</div>';
    });
  }

  loadDataAndRender();
}());

