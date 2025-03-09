import {Search} from "./components/Search.jsx";
import {useDebounce} from 'react-use';
import {useState, useEffect} from "react";
import MovieCard from "./components/MovieCard.jsx";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";
const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${API_KEY}`,
    }
}
const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);
    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try{
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                :`${API_BASE_URL}/discover/movie`;
            const response = await fetch(endpoint, API_OPTIONS);
            if(!response.ok){
                throw new Error("Faild to fetch movies");
            }
            const data = await response.json();
            if(data.Response === 'false'){
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return
            }
            setMovieList(data.results || []);

            if(query && data.results.length){
                updateSearchCount(query, data.results[0]);
            }
        }catch(e){
            console.log(`Error fetching movies: ${e}`);
            setErrorMessage('Error fetching movies, Please try again later');
        } finally {
            setIsLoading(false);
        }
    }
    const loadTrendingMovies = async () => {
        try{
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        }catch(e){
            console.error(`Error Fetching trending movies: ${e}`);
        }
    }
    useEffect(() => {
        fetchMovies(searchTerm);
    },[debouncedSearchTerm]);
    useEffect(() => {
        loadTrendingMovies();
    },[])
    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
               <header>
                   <img src='/hero-img.png' alt='Hero Banner' />
                   <h1>Find <span className="text-gradient">Movies</span> You Will Enjoy Without the Haste </h1>
                   <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
               </header>
                {trendingMovies.length > 0 && (
                    <section className='trending'>
                        <h2>Trending Movies</h2>

                        <ul>
                            {trendingMovies.map((movie,index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <p className='text-gradient'>Loading...</p>
                    ): errorMessage? (
                        <p className='tex-red-500'>{errorMessage}</p>
                        ): (
                            <ul>
                                {movieList.map(movie => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
export default App
