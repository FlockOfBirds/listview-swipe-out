# Listview Swipe Out

This is a DEMO widget and is NOT suitable for PRODUCTION.
No warranty is delivered and no further version other than this demo will be provided.

 - The widget is placed below the list view and the list view is identified by a CSS class
 - Items from the list can swiped left and right out of the screen.
 - Party swiped out items will return to there original place and the action is canceled.
 - The list view items should contain three div block, the CSS class can be selected in the widget.
   - Normal view, will be shown by default
   - Left background, will be shown below the item, when swiped to the left
   - Right background, will be shown below the item, when swiped to the right 
 - Microflows can be connected 
   - Action left swipe out 
   - Action right swipe out
   - A delay can be set before triggering the microflow
 - The after swipe behavior can be selected
   - "Remove": Item will be hidden from the list
   - "Non" where the left/right background stays
 - Test if the implementation can use the preferred and new Mendix Touch/Swipe API
