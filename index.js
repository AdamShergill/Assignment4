async function setupGrid(numberOfCards) {
    try {
      const cardData = await constructCardData(numberOfCards);
      const gameGrid = $("#game_grid");
  
      for (let i = 0; i < cardData.length; i++) {
        const card = $("<div>").addClass("card");
        const frontFace = $("<img>")
          .attr("id", cardData[i].id)
          .addClass("front_face")
          .attr("src", cardData[i].frontFace)
          .attr("alt", "");
        const backFace = $("<img>")
          .addClass("back_face")
          .attr("src", "back.webp")
          .attr("alt", "");
  
        card.append(frontFace);
        card.append(backFace);
        gameGrid.append(card);
      }
  
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  const fetchPokemonInfo = async (numberOfPokemon) => {
    const pokemonArray = [];
    const startTime = new Date();
  
    const getRandomNumber = () => Math.floor(Math.random() * 1000) + 1;
  
    const fetchPromises = Array.from({ length: numberOfPokemon }, async () => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${getRandomNumber()}`);
      const data = await response.json();
      pokemonArray.push(data.sprites.other["official-artwork"].front_default);
    });
  
    await Promise.all(fetchPromises);
  
    const endTime = new Date();
    const totalTime = endTime - startTime;
  
    console.log(`Fetched ${numberOfPokemon} Pokémon in ${totalTime} milliseconds.`);
  
    return pokemonArray;
  };
  
  const constructCardData = async (numberOfCards) => {
    const pokemonUrls = await fetchPokemonInfo(numberOfCards / 2);
  
    const cardData = [];
    for (let i = 0; i < numberOfCards; i += 2) {
      const id = `img${i + 1}`;
      const frontFace = pokemonUrls[i / 2];
  
      cardData.push({ id, frontFace }, { id: `img${i + 2}`, frontFace });
    }
  
    for (let i = cardData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardData[i], cardData[j]] = [cardData[j], cardData[i]];
    }
  
    return cardData;
  };
  
  async function setDifficulty(difficulty) {
    const gridWidths = {
      16: { width: '600px', height: '600px', cardWidth: '25%', imgHeight: '150px' },
      30: { width: '720px', height: '600px', cardWidth: '16.66%', imgHeight: '120px' },
      54: { width: '900px', height: '600px', cardWidth: '11.11%', imgHeight: '100px' }
    };
  
    if (difficulty in gridWidths) {
      await setupGrid(difficulty);
      const gridSettings = gridWidths[difficulty];
      $('#game_grid').css({ width: gridSettings.width, height: gridSettings.height });
      $('.card').css({ width: gridSettings.cardWidth, height: gridSettings.cardHeight });
      $('img').css({ height: gridSettings.imgHeight });
    }
  }
  
  let clicks = 0;
  let firstCard = null;
  let secondCard = null;
  let failedAttempts = 0;
  let isClickable = true;
  let totalPairs = 0;
  let flippedCards = [];
  
  function handleCardClick() {
    if (!isClickable || $('#game_grid').attr('data-disabled') === 'true') return;
    if (firstCard && $(this).find(".front_face")[0].id == firstCard.id) return;
  
    clicks++;
    $('#clicks').text(`Clicks: ${clicks}`);
  
    $(this).toggleClass("flip");
  
    if (!firstCard) {
      firstCard = $(this).find(".front_face")[0];
    } else if (!secondCard) {
      isClickable = false;
      secondCard = $(this).find(".front_face")[0];
  
      if (firstCard.src === secondCard.src && firstCard.id != secondCard.id) {
        $(`#${firstCard.id}`).parent().off("click");
        $(`#${secondCard.id}`).parent().off("click");
  
        flippedCards.push(firstCard.id, secondCard.id);
        $('#pairsLeft').text(`Pairs Left: ${totalPairs - (flippedCards.length / 2)}`);
        $('#pairsMatched').text(`Pairs Matched: ${flippedCards.length / 2}`);
  
        if ((flippedCards.length / 2) === totalPairs) {
          setTimeout(function() {
            $('#winClicks').text(clicks);
            const timerValue = $('#timer').text();
            const number = parseInt(timerValue.replace('Timer: ', ''));
            $('#winTime').text(number);
            $('#winModal').modal('show');
          }, 2000);
        }
  
        firstCard = null;
        secondCard = null;
        isClickable = true;
        failedAttempts = 0;
      } else {
        setTimeout(() => {
          if (!flippedCards.includes(firstCard.id)) {
            $(`#${firstCard.id}`).parent().toggleClass("flip");
          }
          if (!flippedCards.includes(secondCard.id)) {
            $(`#${secondCard.id}`).parent().toggleClass("flip");
          }
  
          firstCard = null;
          secondCard = null;
          isClickable = true;
  
          failedAttempts++;
          if (failedAttempts >= 4) {
            isClickable = false;
            setTimeout(() => {
              $(".card").each(function () {
                const frontFace = $(this).find(".front_face")[0];
                if (!flippedCards.includes(frontFace.id)) {
                  $(this).addClass("flip");
                }
              });
              setTimeout(() => {
                $(".card").each(function () {
                  const frontFace = $(this).find(".front_face")[0];
                  if (!flippedCards.includes(frontFace.id)) {
                    $(this).removeClass("flip");
                  }
                });
                isClickable = true;
              }, 2000);
            }, 1000);
            failedAttempts = 0;
          }
        }, 1000);
      }
    }
  }
  
  const setup = async (difficulty) => {
    await setDifficulty(difficulty);
  
    const gridSettings = { 16: 8, 30: 15, 54: 27 };
    totalPairs = gridSettings[difficulty];
    $('#totalPairs').text(`Total Pairs: ${totalPairs}`);
    $('#pairsLeft').text(`Pairs Left: ${totalPairs}`);
  
    $(".card").on("click", handleCardClick);
  };
  
  // Call the setup function with the desired difficulty (16, 30, or 54)
  $(document).ready(() => {
    const difficulty = 16;
    setup(difficulty);
  });
  