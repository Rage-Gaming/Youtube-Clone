import HistoryContent from '@/components/HistoryContent'
import { Suspense } from 'react'

const index = () => {
    return (
        <div>
            <div>
                <h1>Watch History</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <HistoryContent />
                </Suspense>
            </div>
        </div>
    )
}

export default index