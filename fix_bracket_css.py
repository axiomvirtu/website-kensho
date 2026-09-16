with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

old_block_start = content.find('.inline-bracket-preview {')
old_block_end = content.find('.bracket-page {')

new_css = """.inline-bracket-preview {
    display: grid;
    gap: 16px;
    margin-top: 4px;
    padding-top: 22px;
    border-top: 1px solid var(--line);
}

.inline-bracket-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.inline-bracket-header h2 {
    margin: 4px 0 0;
    font-size: 20px;
}

.inline-bracket-header .status-message {
    margin: 0;
}

.inline-bracket-board {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    min-width: 780px;
    overflow-x: auto;
    padding: 0 0 12px;
}

/* Each round column */
.inline-bracket-round {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    padding: 0 8px;
    gap: 8px;
}

.inline-bracket-round:first-child {
    padding-left: 0;
}

.inline-bracket-round:last-child {
    padding-right: 0;
}

.inline-bracket-round h3 {
    margin: 0 0 6px;
    color: var(--muted);
    font: 700 9.5px "DM Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
    white-space: nowrap;
}

/* Match list - vertically distributes cards */
.inline-bracket-matches {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    flex: 1;
    gap: 6px;
    min-height: 496px;
}

/* Match card */
.inline-bracket-match {
    display: flex;
    flex-direction: column;
    border: 1.5px solid var(--line);
    border-radius: 5px;
    background: var(--paper);
    box-shadow: 0 2px 8px rgba(21, 58, 63, .06);
    overflow: hidden;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.inline-bracket-match:hover {
    border-color: var(--accent);
    box-shadow: 0 3px 14px rgba(10, 135, 125, .14);
}

/* Row inside a match card (for each player/slot) */
.inline-bracket-player,
.inline-bracket-empty {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    min-height: 34px;
    border-bottom: 1px solid var(--line);
}

.inline-bracket-player:last-child,
.inline-bracket-empty:last-child {
    border-bottom: 0;
}

/* Slot label column (A, B, Q etc.) */
.inline-bracket-player > span,
.inline-bracket-empty > span {
    flex: 0 0 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: var(--accent);
    font: 700 8.5px "DM Mono", monospace;
    letter-spacing: 0.04em;
    border-right: 1px solid var(--line);
    min-height: 34px;
}

/* Player info area */
.inline-bracket-player strong {
    display: block;
    overflow: hidden;
    color: var(--ink-soft);
    font-size: 9.5px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
    padding: 4px 7px 1px;
}

.inline-bracket-player small {
    display: block;
    overflow: hidden;
    color: var(--muted);
    font-size: 7.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
    padding: 0 7px 4px;
}

/* Empty slot */
.inline-bracket-empty {
    opacity: 0.5;
}

.inline-bracket-empty em {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 4px 7px;
    color: var(--muted);
    font-size: 8.5px;
    font-style: italic;
    white-space: nowrap;
    text-overflow: ellipsis;
}

"""

content = content[:old_block_start] + new_css + content[old_block_end:]

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. CSS updated.')
