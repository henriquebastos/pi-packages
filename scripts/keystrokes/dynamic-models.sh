# dynamic-models.sh - Keystrokes for pi-dynamic-models screenshot
# $WID is the iTerm window ID

# Wait for pi to fully load
sleep 3

# Type /model to open model selector
osascript -e "tell application \"iTerm2\" to tell current session of window id ${WID} to write text \"/model\" without newline"
sleep 1

# Press Enter to open the selector
osascript -e "tell application \"iTerm2\" to tell current session of window id ${WID} to write text (ASCII character 13)"
sleep 2

# Type "local-llm" to search for the dynamic model
osascript -e "tell application \"iTerm2\" to tell current session of window id ${WID} to write text \"local-llm\" without newline"
sleep 2
