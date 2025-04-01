// ==UserScript==
// @name        Syllabus Clicker
// @match       https://dreams.dokkyo.ac.jp/campusweb/campusportal.do?*
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @version     1.7
// @author      XTC
// @description A simple userscript that adds a button for each cell of classes you've registered. Those buttons will allow you to refer syllabuses easily.
// @icon        https://www.dokkyo.ac.jp/images/app.png?ver=2020
// ==/UserScript==

/*
  Why did I note this? I don't remember any of it.
  I can't be arsed. Someone pls lemme know.
  I assume it was supposed to be used for URL matching??
   
  parent: campusportal.do 
  children: campussquare.do
*/

console.log(`[${GM_info.script.name} v${GM_info.script.version}] Hello.`);

/**
 * @type {Document} embed - Obtain the iframe tag.
 */
const embed = document.getElementById("main-frame-if");
if (embed == null) return; // Try to obtain 履修登録のテーブル, if unavailable (null) == not 履修のページ, do nothing.

/**
 * @type {number} numero - Initialized to 0. Intended to save 時間割コード temporarily.
 * @type {Document|undefined} spell - A reference of the DOM of the page loaded inside the iframe or undefined.
 * @type {string|undefined} language - A string representing the selected language (Ja/En), or undefined.
 */
let numero = 0, spell, language;

// This event will be triggered when an iframe has been loaded.
embed.addEventListener('load', function() {
  // Detect language (Either Ja/En)
  language = getLanguage();

  /**
   * Reference to the document inside an embedded iframe.
   * 
   * @type {Document}
   */
  spell = embed.contentWindow.document;

  /**
   * Boolean flags indicating the presence of various elements in the DOM.
   * 
   * @const {boolean} a_ji_search - Whether the input field with ID `jikanwaricd`(時間割コード) exists.
   * @const {boolean} a_ji_result - Whether an input field exists in the 8th child column of a table row. (Syllabus inquiry)
   * @const {boolean} a_search_pr - Whether the element with ID `kyokanNm` exists. (Prof's name (in JP) on teacher contact info)
   * @const {boolean} a_pr_result - Whether any anchor tags exist inside the `officeHourForm` table. (Prof's name. Both in JP & EN)
   * @const {boolean} a_e_search - Whether a stored GM value (`s`) is not null. (Search courses in an empty period)
   * @const {boolean} a_rishu_p - Whether the page is for 履修登録・登録状況照会 or not.
   */
  const a_ji_search = $(spell).find('#jikanwaricd').length > 0,
        a_ji_result = $(spell).find("body > table > tbody > tr > td:nth-child(8) > input").length > 0,
        a_search_pr = $(spell).find('#kyokanNm').length > 0,
        a_pr_result = $(spell).find('#officeHourForm > table > tbody a').length > 0,
        a_e_search  = GM_getValue('s') != null,
        a_rishu_p   = $(spell).find('#main-portlet-title > span:contains("履修登録・登録状況照会"), #main-portlet-title > span:contains("Course registration")').length > 0;

  // DEBUGGING:
  // console.log('loaded', a_ji_search, a_ji_result, a_search_pr, a_pr_result);

  /* 
    Checks if the current page is シラバス参照／条件入力 or not.
    
    To avoid malfunctioning, this must check whether it has saved the course code(numero).
    Runs only when numero isn't zero.
   */
  if (a_ji_search && numero != 0) {
    // Insert value
    $(spell).find('#jikanwaricd').val(numero);
    // Click search button.
    $(spell).find('#jikanwariSearchForm > table > tbody > tr:nth-child(19) > td > p > input:nth-child(1)').click();
    // Reset el numero
    numero = 0;
    return;
  }

  /* 
    Checks if the current page is シラバス参照／条件入力 or not.
    
    However, this time, the script tries to search courses in an empty period and not certain course.
  */
  if (a_ji_search && a_e_search) {
    let obj = GM_getValue('s');
    $(spell).find('#gakkiKubunCode').val(obj['s']);
    $(spell).find('#yobi').val(obj['d']);
    $(spell).find('#jigen').val(obj['p']);
    $(spell).find('#nenji').val(obj['y']);
    GM_deleteValue('s');

    $(spell).find('#jikanwariSearchForm > table > tbody > tr:nth-child(19) > td > p > input:nth-child(1)').click();
    return;
  }

  /*
    Checks if it's showing the result of inquiry or not.
    
    Clicks & opens a new tab that you get from the result by clicking a course code on 履修科目 table.
  */ 
  if (a_ji_result) {
    // Click the 'refer' button.
    // $(spell).find('body > table > tbody > tr > td:nth-child(8) > input').click();

    // Go back to the course page.
    // $('#tab-rs').click();
    return;
  }

  /*
    Checks if the current page is the searching page about professors' contacts.
    Checks the availability and value that this script saved.
  */
  if (a_search_pr && GM_getValue('nombre')) {
    // dom's innertext should be either 'Japanese' or 'English'
    let nombre = GM_getValue('nombre'),
        hasJpChar = nombre.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/) != null;

    /*
      PorTa2 has an INTERESTING system that
      a professor with non-Japanese name will be
      given translated name and their actual name.
      And if the user is using English on PorTa2,
      it will show their name with alphabets.
      But they won't translate Japanese professor's
      name into Englsih.
    */
    if (hasJpChar) {
      $(spell).find('#kyokanNm').val(nombre);
    } else {
      $(spell).find('#kyokanNmEng').val(nombre.split(' ')[0])
    }
    GM_deleteValue('nombre');
    $(spell).find("#officeHourForm > table > tbody > tr:nth-child(8) > td > p > input:nth-child(1)").click();

    // No malfunctioning. The following if statement must work only when the user clicks the hyperlink .nombre.
    GM_setValue('n_click', true);
    return;
  }

  // Check if the page is showing the result of professor's contact & Going to search one particular professor.
  if (a_pr_result && GM_getValue('n_click')) {
    let nombre_hlink = $(spell).find('#officeHourForm > table > tbody a');
    // Check if there are more than 1 person with same name.
    // -> for example:  'Adam GYENES', 'Adam ZOLLINGER'
    if (nombre_hlink.length <= 1) {
      // Click their name and open the contacts and details.
      nombre_hlink[0].click();
    }
    GM_deleteValue('n_click');
    return;
  }

  // If it's not the 履修 page, go return and don't do any of those actions written below.
  if (!a_rishu_p) {
    return;
  }

  /**
   * Selects the course table from the document.
   *
   * @type {number} i - Iterator for looping through the table rows.
   * @type {jQuery} mesa - A jQuery object containing tbody elements of the course table.
   *   - It selects `tbody` elements inside nested tables,
   *   - Skips elements with the class `.rishu-koma-head` (オレンジの枠, e.g. 曜日/時間),
   *   - Extracts course-related information.
   */
  let i = 0, mesa = $(spell).find(`* > tr:nth-child(2) > td > table tbody tr td:not(.rishu-koma-head) table tbody`);

  while (i < mesa.length) {
    /**
     * Extracts course details from a table cell.
     *
     * @type {Element} el - The current table cell element.
     * @type {string} texto - The text content of the cell.
     * @type {string[]} lista - An array of text lines split by newlines.
     *   Example:
     *   [
     *     '12345　　2',
     *     'Writing Skills I',
     *     'John Smith'
     *   ]
     *   [
     *     'Course Code and Credit(s)',
     *     'Course Name',
     *     'Name of the professor'
     *   ]
     * @type {string} num - The extracted course code (without extra spaces).
     * @type {string} nombre - The name of the professor.
     * @type {jQuery} cell - The jQuery object containing the first row's table data (`td`). Intended to overwrite the cell element and content.
     */
    let el     = mesa[i],
        texto  = el.innerText,
        lista  = texto.split('\n'),
        num    = lista[0].split("　　")[0].split(' ').join(''),
        nombre = lista[2],
        cell   = $(el).find('tr:eq(0) td');
    i = i + 1;

    // Ignore if the cell is empty.
    if (!texto.includes('None') && !texto.includes('未登録')) {
      // Remove the existing code(numero) and Professor's name.
      cell.html(cell.html().replace(num, '').replace(nombre, ''));
      // Make an alternative text with hyper link.
      cell.prepend($(`<a class='fp2' href='#'>${num}</a>`).css({'font-weight': 'bold'}));
      cell.append($(`<a class='nombre' href='#'>${nombre}</a>`));

      // When it's 履修登録, delete button for it will show up on temporary registered course.
      let remBtn = cell.find('[onclick*=DeleteCallA]');
      if (remBtn.length != 0) {
        let neighborCell = $(el).find('tr:eq(1) td'),
            remBtnContent = remBtn.attr('onclick');
        // Delete original button
        remBtn.remove();
        // Add the copied version
        neighborCell.prepend($(`<a class='delBtn' onclick='${remBtnContent}' href='#'>[削除]</a>`).css('float', 'left'));
      }
    }
  }

  // Load options & Add option buttons
  addOptionButtons();
  loadOptions();

  // When you click the hyperlink of course code.
  $(spell).find('.fp2').on('click', function() {
    // Split the text. From '12749　　2' to ['12749', '2']. First item must be the course code and second must be the credits for its course.
    numero = $(this)[0].innerText;
    // Click the 'Syllabus Inquiry' or 'シラバス参照' above the page. The iframe (#main-frame-if) will change to the syllabus inquiry one.
    $(document).find("#tabmenu-ul > li:nth-child(5) span").click();
    return false;
  });

  // When you click the hyperlink of teacher's name.
  $(spell).find('.nombre').on('click', function() {
    // This script needs to save professor's name as a value.
    // Because page changes after click the button(教員連絡先).
    GM_setValue('nombre', $(this).text());
    // Click the button above the page.
    $('#tab-Kyo').click();
    return false;
  });

});

/**
 * Adds an option button for searching empty course slots.
 */
function addOptionButtons() {
  /**
   * @type {jQuery} p - The title element of the main portlet.
   * @type {jQuery} div - A div container for the new UI elements, aligned to the right.
   */
  let p = $(spell).find('#main-portlet-title'), div = $('<div>').css('float', 'right');

  /**
   * @type {jQuery} searchEmptyCourses - A checkbox input for enabling/disabling empty course search.
   * @type {jQuery} secTooltip - A tooltip warning about inconsistencies in search results.
   */
  let searchEmptyCourses = $(`<input type='checkbox' id='searchEmptyCourses'>`),
      secTooltip = $(`<span title='WARNING!! 何故か履修登録の「未登録」ボタンとは違う検索結果が出る。'>(?)</span>`).css('cursor', 'pointer');

  searchEmptyCourses.on('change', function () {
    let enabled = GM_getValue('sec-enabled'), checked = $(this).is(':checked');
    if (checked) {
      addSearchEmptyCourseButtons();
    } else {
      $(spell).find('.sec').remove();
    }
    GM_setValue('sec-enabled', checked);
  });

  div.append($(`<span>`).text('空きコマ検索').append(secTooltip).append(searchEmptyCourses));
  p.after(div);
}

/**
 * Loads saved options from GM storage and initializes the empty course search if enabled.
 */
function loadOptions() {
  /**
   * @type {boolean} searchEmptyCourses - The stored value for whether the empty course search is enabled.
   */
  let searchEmptyCourses = GM_getValue('sec-enabled');
  if (searchEmptyCourses) {
    addSearchEmptyCourseButtons();
    $(spell).find('#searchEmptyCourses').attr('checked', '');
  }
}

/**
 * Gets the language the user's using.
 * 
 * PorTa II provides English button in Japanese written page, so that English speakers can switch the page into English. 
 * Vice versa, thus, we can detect which language the page is showing by checking at the specific and reverse the text in the button.
 */
function getLanguage() {
  let a = $('#portallocale > li.txt > span').text();
  switch (a) {
    case 'English':
      return 'Japanese';
    case 'Japanese':
      return 'English';
  }
}

/**
 * So uh I added this function when I was bored and thinking about the next semester 
 * but I was unable to use the same function that Dokkyo was providing,
 * So I decided to make something similar, 
 * but it's not even close
 * 
 * but I published them anyway...
 */
function addSearchEmptyCourseButtons() {
  let i = 0, mesa = $(spell).find(`* > tr:nth-child(2) > td > table tbody tr td:not(.rishu-koma-head) table tbody`);
  while (i < mesa.length) {
    let el     = mesa[i],
        texto  = el.innerText,
        lista  = texto.split('\n'),
        num    = lista[0].split("　　")[0].split(' ').join(''),
        nombre = lista[2],
        cell   = $(el).find('tr:eq(0) td');
    i = i + 1;

    // Ignore if the cell is empty.
    if (texto.includes('None') || texto.includes('未登録')) {
      // Put search buttons for each empty cells
      let button = $(`<img class='sec' src='/campusweb/theme/default/newportal/image/icon/func_refer4.gif'>`);
      button.css({
        'cursor': 'pointer',
        'float': 'right'
      })
      button.on('click', function() {
        let td = $(cell).closest('td > .rishu-koma-inner').parent(),
            row = td.index(),
            column = td.parent().index(),
            semester = $(spell).find('* > tr:nth-child(1) > td > table > tbody > tr > td.rishu-tab-sel').index() + 1,
            year = Number( $(spell).find('body > table:nth-child(4) > tbody > tr:nth-child(1) > td:nth-child(4)').text().slice(0, 1) );
        GM_setValue('s', {
          'd': row,
          'p': column,
          's': semester,
          'y': year,
        });
        // 'シラバス参照'
        $(document).find("#tabmenu-ul > li:nth-child(5) span").click();
        return false;
      });
      cell.append(button);
    }
  }
}