// ==UserScript==
// @name        PorTa2_ReadAll
// @match       https://dreams.dokkyo.ac.jp/campusweb/campusportal.do
// @grant       GM_setValue
// @grant       GM_getValue
// @version     1.3
// @author      XTC
// @description
// @icon        https://www.google.com/s2/favicons?sz=64&domain=www.dokkyo.ac.jp
// ==/UserScript==

// Select the target node.
var target = document.querySelector('#main-frame-div'), puto = false;

// Create an observer instance.
var observer = new MutationObserver(function(mutations) {
  if ($('#excuteporta2_readall').length > 0) return;
  // if it's the bullet board page
  if (!($('input[value="新着掲示"]').length > 0 && $(target).css('opacity') == '1')) {
    return;
  }
  insertButtons();

  $('#excuteporta2_readall').on('click', function() {
    /*
     *
     * LOAD BOTH UNREAD & READ MARKED PAGES:
     *   let el = $('.genre-list a[href="JavaScript:void(0);"]:not(.right a)');
     *
     * LOAD ONLY UNREAD PAGES:
     *   let el = $('.highlight_red').parent().find('a');
     *
     */

    let el = $('.highlight_red').parent().find('a');
    let list = getList(); // Get today's list.
    el.each(function(index) {
      let cmd = $(this).attr('onclick'); // Identify the article.
      cmd = cmd.replace(/showDetail|;/g, '').replace(/\(|\)|'/g, "").split(', ');
      let url = getURL(cmd), // URL of the article.
          category = $(this).closest(".keiji-list").parent().find('div')[0].innerText, // Name of the category
          articleTitle = el[index].innerText, // Name of the article
          categoryList = list[category] != null ? list[category] : {};// the list of article for each category.

      categoryList[articleTitle] = cmd;
      list[category] = categoryList;

      $.ajax({
        url: url
      }).success(function(data) {
      // console.log($(data).filter('title').text());
      });

      if (index == el.length - 1) {
        GM_setValue(date(), list);
        addDate(date());
        // loadPortletPost('main_PTW0005300_menu', 'main_PTW0005300_menu-KeijiNewlyArrivedForm');
        $("#tabmenu-ul span:contains('新着掲示')").click();
        // document.querySelector("#tabmenu-ul > li:nth-child(2) > span").click();
      }
    });

    if (el.length == 0 && !puto) {
      changeButton(this, "YOU READ ALL!");
    }
  });

  $('#p2_ra_checklogs').on('click', function() {
    $("#wf_PTW0000012_20120826102956-dlg").dialog({
      autoOpen: true,
      modal: true,
      width: 340,
      height: 240,
      resizable: false,
      title: ('LINKS THAT THIS TOOL HAS OPENED:'),
      open: function(event) {
        $(this).parent().find(".ui-dialog-titlebar-close").hide();

        let dateList = GM_getValue('dates').reverse(), msgBox = $('<div id="PorTa2_ReadAll_DIALOG"></div>');
        if (dateList == null) return;

        for (let i = 0; i < dateList.length; i++) {
          $(msgBox).append(`<span style='font-weight: bold;'>[ ${dateList[i]} ]</span><br>`)
          let list = GM_getValue(dateList[i]), categories = Object.keys(list);

          for (let c = 0; c < categories.length; c++) {
            let category = categories[c];
            $(msgBox).append(`<span>${category}</span><br>`);

            let articles = Object.keys(list[categories[c]]), elList = $('<ul></ul>');
            for (let a = 0; a < articles.length; a++) {
              let article = articles[a];
              elList.append(`<li><a onclick='window.open("${getURL(list[category][article])}", "_blank")' href='#'>${article}</a></li>`);
            }
            $(msgBox).append(elList);
          }
        }
        $(this).append(msgBox);
      },
      close: function(){
        $('#PorTa2_ReadAll_DIALOG').remove();
        $(this).dialog("destroy");
      }
    });
  })
});

// Pass in the target node, as well as the observer options.
observer.observe(target, {
    attributes:    true,
    childList:     true,
    characterData: true
});

function getURL(array) {
  if (array.length <= 2) return null;
  let keijitype = array[0], genrecd = array[1], seqNo = array[2];
  return `${location.origin}/campusweb/campussquare.do?_flowId=KJW0001100-flow&_campus_new_portal=true&_action_id=displayPortletRequest&keijitype=${keijitype}&genrecd=${genrecd}&seqNo=${seqNo}`;
}

function insertButtons() {
  $('#main_PTW0005300_menu-title').append($(`<input type='button' value='READ ALL' id='excuteporta2_readall'>`));
  $('#main_PTW0005300_menu-title').append($(`<input type='button' value='SEE THE RECORDS' id='p2_ra_checklogs'>`));
}

function changeButton(element, text) {
  let d = $(element).val();
  $(element).val(text);
  puto = true;
  setTimeout(() => {$(element).val(d); puto = false;}, 700);
}

function date() {
  let date = new Date();
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

function getList() {
  let el = GM_getValue(date());
  return el != null ? el : {};
}

function addDate(date) {
  let list = GM_getValue('dates');
  if (list == null) list = [];
  if (list.includes(date)) return;
  list.push(date);
  GM_setValue('dates', list);
}

function reverse(url) {
  let param = new URLSearchParams(new URL(url).search);
  return [param.get("keijitype"), param.get("genrecd"), param.get("seqNo")];
}