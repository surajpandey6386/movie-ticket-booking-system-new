import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import KConverter from "../../lib/KConverter";
import { useAppContext } from "../../context/appContext";
import toast from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // NEW: Multiple dates
  const [selectedDates, setSelectedDates] = useState([]);

  // NEW: Multiple times
  const [selectedTimes, setSelectedTimes] = useState([]);

  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  // ==============================
  // GET NOW PLAYING MOVIES
  // ==============================

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setNowPlayingMovies(data.movies);
      }
    } catch (error) {
      console.error("Error fetching movies", error);
    }
  };

  // ==============================
  // ADD DATE
  // ==============================

  const handleDateAdd = () => {
    if (!dateInput) {
      toast.error("Please select a date");
      return;
    }

    // Prevent duplicate date
    if (selectedDates.includes(dateInput)) {
      toast.error("This date is already selected");
      return;
    }

    // Prevent past dates
    const today = new Date().toISOString().split("T")[0];

    if (dateInput < today) {
      toast.error("You cannot select a past date");
      return;
    }

    setSelectedDates((prev) => [...prev, dateInput].sort());

    // Clear input
    setDateInput("");
  };

  // ==============================
  // REMOVE DATE
  // ==============================

  const handleRemoveDate = (date) => {
    setSelectedDates((prev) => prev.filter((item) => item !== date));
  };

  // ==============================
  // ADD TIME
  // ==============================

  const handleTimeAdd = () => {
    if (!timeInput) {
      toast.error("Please select a time");
      return;
    }

    // Prevent duplicate time
    if (selectedTimes.includes(timeInput)) {
      toast.error("This time is already selected");
      return;
    }

    setSelectedTimes((prev) =>
      [...prev, timeInput].sort()
    );

    // Clear input
    setTimeInput("");
  };

  // ==============================
  // REMOVE TIME
  // ==============================

  const handleRemoveTime = (time) => {
    setSelectedTimes((prev) =>
      prev.filter((item) => item !== time)
    );
  };

  // ==============================
  // SUBMIT SHOW
  // ==============================

  const handleSubmit = async () => {
    try {
      if (!selectedMovie) {
        return toast.error("Please select a movie");
      }

      if (selectedDates.length === 0) {
        return toast.error("Please select at least one date");
      }

      if (selectedTimes.length === 0) {
        return toast.error("Please select at least one time");
      }

      if (!showPrice) {
        return toast.error("Please enter show price");
      }

      setAddingShow(true);

      // =========================================
      // IMPORTANT
      // Every selected time will be applied
      // to every selected date.
      // =========================================

      const showsInput = selectedDates.map((date) => ({
        date: date,
        time: selectedTimes,
      }));

      console.log("Shows being sent:", showsInput);

      const payload = {
        movieId: selectedMovie,
        showsInput,
        showPrice: Number(showPrice),
      };

      const { data } = await axios.post(
        "/api/show/add",
        payload,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);

        // Reset everything
        setSelectedMovie(null);
        setSelectedDates([]);
        setSelectedTimes([]);
        setDateInput("");
        setTimeInput("");
        setShowPrice("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setAddingShow(false);
    }
  };

  // ==============================
  // FETCH MOVIES
  // ==============================

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);

  // ==============================
  // UI
  // ==============================

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />

      {/* ========================================
          MOVIES
      ======================================== */}

      <p className="mt-10 text-lg font-medium">
        Now Playing Movies
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={image_base_url + movie.poster_path}
                  alt=""
                  className="w-full object-cover brightness-90"
                />

                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />

                    {movie.vote_average.toFixed(1)}
                  </p>

                  <p className="text-gray-300">
                    {KConverter(movie.vote_count)} Votes
                  </p>
                </div>
              </div>

              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                  <CheckIcon
                    className="w-4 h-4 text-white"
                    strokeWidth={2.5}
                  />
                </div>
              )}

              <p className="font-medium truncate">
                {movie.title}
              </p>

              <p className="text-gray-400 text-sm">
                {movie.release_date}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================
          SHOW PRICE
      ======================================== */}

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">
          Show Price
        </label>

        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">
            {currency}
          </p>

          <input
            min={0}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter show price"
            className="outline-none"
          />
        </div>
      </div>

      {/* ========================================
          SELECT MULTIPLE DATES
      ======================================== */}

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Dates
        </label>

        <div className="inline-flex gap-3 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="outline-none rounded-md"
          />

          <button
            onClick={handleDateAdd}
            type="button"
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Date
          </button>
        </div>
      </div>

      {/* ========================================
          SELECTED DATES
      ======================================== */}

      {selectedDates.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 font-medium">
            Selected Dates
          </h2>

          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date) => (
              <div
                key={date}
                className="border border-primary px-3 py-2 flex items-center gap-2 rounded"
              >
                <span>{date}</span>

                <DeleteIcon
                  onClick={() => handleRemoveDate(date)}
                  width={16}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
          SELECT MULTIPLE TIMES
      ======================================== */}

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Show Timings
        </label>

        <div className="inline-flex gap-3 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />

          <button
            onClick={handleTimeAdd}
            type="button"
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* ========================================
          SELECTED TIMES
      ======================================== */}

      {selectedTimes.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 font-medium">
            Selected Timings
          </h2>

          <div className="flex flex-wrap gap-2">
            {selectedTimes.map((time) => (
              <div
                key={time}
                className="border border-primary px-3 py-2 flex items-center gap-2 rounded"
              >
                <span>{time}</span>

                <DeleteIcon
                  onClick={() => handleRemoveTime(time)}
                  width={16}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
          SHOW PREVIEW
      ======================================== */}

      {selectedDates.length > 0 &&
        selectedTimes.length > 0 && (
          <div className="mt-8 border border-primary/30 rounded-lg p-4 bg-primary/5">
            <h2 className="font-medium text-lg mb-3">
              Show Preview
            </h2>

            <p className="text-sm text-gray-400 mb-4">
              The selected timings will be applied to
              every selected date.
            </p>

            <div className="space-y-3">
              {selectedDates.map((date) => (
                <div key={date}>
                  <p className="font-medium">
                    {date}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTimes.map((time) => (
                      <span
                        key={`${date}-${time}`}
                        className="text-sm border border-primary px-2 py-1 rounded"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Total shows to create:{" "}
              <span className="text-primary font-medium">
                {selectedDates.length *
                  selectedTimes.length}
              </span>
            </p>
          </div>
        )}

      {/* ========================================
          ADD SHOW BUTTON
      ======================================== */}

      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
      >
        {addingShow ? "Adding Shows..." : "Add Shows"}
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;