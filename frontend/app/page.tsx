/**
 * landing page tentatively for scaffold
 * 
 */

export default function HomePage(){
    return (
        <main className="page">
            <section className="hero">
                <p className="eyebrow">TaskSync AI</p>
                <h1 className="title">Serverless, AI-equipped task management application.</h1>
                <p className="description">Welcome to TaskSync AI, your ultimate task management solution. Our serverless architecture ensures seamless performance, while our AI capabilities help you stay organized and productive. Experience the future of task management with TaskSync AI.</p>
                <div className="card">
                    <h2>Get Started</h2>
                    <p>
                        Frontend and backend base in place, next will add API, entity modeling, authentication and taskboard's workflows
                    </p>
                </div>
            </section>
        </main>
    );
}