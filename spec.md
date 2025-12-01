# Moodle MP4 downloadewr

Create firefox plugin that shows a button overlay for each video that is displayed (kautura switch) that copies a command to clipobard to ffmpeg download the video

Example command:

ffmpeg -i 'https://api.kaltura.switch.ch/p/111/sp/11100/playManifest/entryId/0_dwokpxlc/flavorIds/0_wgbj2255,0_jqyt289f,0_t8rqjfgf,0_qbze2rky,0_3oyueh8f,0_dqz1kdsu/format/applehttp/protocol/https/a.m3u8?referrer=aHR0cHM6Ly9tb29kbGUua2FsdHVyYS56aGF3LmNo&ks=djJ8MTExfJGa-nidhmNzgzJanNvL-tGt3xl7_xR2F4VB2t3TK4B1WV_t7b1UNoOdImK_FjG_4Rb86VwI5gXqDDyxN4o2t3W9gDhh5QqAJ3_MT-t4D1N0eaDuo4BNWjxk3IauffvmMdOBPLiIXT5wL4velTaayvsGERiRtfdbvYlcuesoYxCqUlLvIbsZCMU21Y5oJR-0FBRjQ34y4AGjJgBKTbjQl1sXBKxlKOGKDmtRxgK2Z02jDkNsauHYPhhpLYj60uwxrRBK4ccP4dyRQOftu81q8GOf7meInOk6u0po9Vibm3rGVjf-DmcAGisXhss-tyDXRq9LD80OVHb2jHKMHfUWYtweWmAHMyGIP6mxmNB914CS8v6qMDpV32wkAsqx6pRqSms689Pl8tGTXu73Txy0uMVpbQGJrd69BE2ldns379wuabCH1gFNQIdOG6VuiAlxbawX6JDk6VbtBiki5DyGiiwel4MGrF8xpracA642rGiRf_RGjHUcZn-pIcsh5S4ciiahtFerKD4qJHTb9uXhicw=&playSessionId=1a57edd7-3801-c6e0-f478-a15f2e1d59bb&clientTag=html5:v2.103&playbackContext=116149&uiConfId=23448458' ~/Downloads/VIDEO_NAME_DATE.mp4


The DOM usually looks something like this:
<span class="kaltura-player-container d-inline-block"><iframe width="400" height="285" class="kaltura-player-iframe" allowfullscreen="true" allow="autoplay *; fullscreen *; encrypted-media *; camera *; microphone *; display-capture *;" src="https://moodle.zhaw.ch/filter/kaltura/lti_launch.php?courseid=25844&amp;height=285&amp;width=400&amp;withblocks=0&amp;source=https%3A%2F%2Fmoodle.kaltura.zhaw.ch%2Fbrowseandembed%2Findex%2Fmedia%2Fentryid%2F0_dwokpxlc%2FshowDescription%2Ffalse%2FshowTitle%2Ffalse%2FshowTags%2Ffalse%2FshowDuration%2Ffalse%2FshowOwner%2Ffalse%2FshowUploadDate%2Ffalse%2FplayerSize%2F400x285%2FplayerSkin%2F23448458%2F" frameborder="0"></iframe></span>

You can check for HTTP requests to "kaltura.switch.ch/p/" to find the video URL if it does not already exist in the DOM.

Use JavaScript to implement this functionality in the Firefox extension.
Make sure to write tests owo

CReate simple README.md file explaining how to install and use the extension.
