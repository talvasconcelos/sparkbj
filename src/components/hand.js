import { Card } from './card'

export const Hand = ({cards, score, dim}) => (
    <div class={`hand ${dim && 'is-dimmed'}`}>
        {cards && cards.map(c => (
            <Card card={c} isFaceDown={c.isFaceDown} />
        ))}
        <span class="score">{score}</span>
    </div>
)