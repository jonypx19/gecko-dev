/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Checks for the AccessibleWalkerActor

add_task(async function () {
  let {client, walker, accessibility} =
    await initAccessibilityFrontForUrl(MAIN_DOMAIN + "doc_accessibility.html");

  let a11yWalker = await accessibility.getWalker(walker);
  ok(a11yWalker, "The AccessibleWalkerFront was returned");

  let a11yDoc = await a11yWalker.getDocument();
  ok(a11yDoc, "The AccessibleFront for root doc is created");

  let children = await a11yWalker.children();
  is(children.length, 1,
    "AccessibleWalker only has 1 child - root doc accessible");
  is(a11yDoc, children[0],
    "Root accessible must be AccessibleWalker's only child");

  let buttonNode = await walker.querySelector(walker.rootNode, "#button");
  let accessibleFront = await a11yWalker.getAccessibleFor(buttonNode);

  checkA11yFront(accessibleFront, {
    name: "Accessible Button",
    role: "pushbutton"
  });

  let browser = gBrowser.selectedBrowser;

  // Ensure name-change event is emitted by walker when cached accessible's name
  // gets updated (via DOM manipularion).
  await emitA11yEvent(a11yWalker, "name-change",
    (front, parent) => {
      checkA11yFront(front, { name: "Renamed" }, accessibleFront);
      checkA11yFront(parent, { }, a11yDoc);
    },
    () => ContentTask.spawn(browser, null, () =>
      content.document.getElementById("button").setAttribute(
      "aria-label", "Renamed")));

  // Ensure reorder event is emitted by walker when DOM tree changes.
  let docChildren = await a11yDoc.children();
  is(docChildren.length, 3, "Root doc should have correct number of children");

  await emitA11yEvent(a11yWalker, "reorder",
    front => checkA11yFront(front, { }, a11yDoc),
    () => ContentTask.spawn(browser, null, () => {
      let input = content.document.createElement("input");
      input.type = "text";
      input.title = "This is a tooltip";
      input.value = "New input";
      content.document.body.appendChild(input);
    }));

  docChildren = await a11yDoc.children();
  is(docChildren.length, 4, "Root doc should have correct number of children");

  // Ensure destory event is emitted by walker when cached accessible's raw
  // accessible gets destroyed.
  await emitA11yEvent(a11yWalker, "accessible-destroy",
    destroyedFront => checkA11yFront(destroyedFront, { }, accessibleFront),
    () => ContentTask.spawn(browser, null, () =>
      content.document.getElementById("button").remove()));

  let a11yShutdown = waitForA11yShutdown();
  await client.close();
  forceCollections();
  await a11yShutdown;
  gBrowser.removeCurrentTab();
});
