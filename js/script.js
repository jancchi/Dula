// Reserved for future enhancements
// Example: smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(anchor.getAttribute('href'))
      .scrollIntoView({ behavior: 'smooth' });
  });
});

/**
 * Dula Project - Main JS
 * 
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));



    const dateInput = document.querySelector('input[name="date"]');
    
    if (dateInput) {

        // Fill from google cloud api
        const occupiedDates = [
            "2024-05-20", 
            "2024-05-21", 
            "2024-06-01",
            "2026-02-20"
        ];

        flatpickr(dateInput, {
            inline: true,
            minDate: "today",
            disable: occupiedDates, 
            dateFormat: "Y-m-d",
            locale: {
                firstDayOfWeek: 1 
            },
            onChange: function(selectedDates, dateStr) {
                console.log("Vybraný dátum:", dateStr);
            }
        });
    }



    const bookingForm = document.querySelector('form[data-netlify="true"]');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(bookingForm);
            const submitBtn = bookingForm.querySelector('button');
            const originalBtnText = submitBtn.innerText;
            
            submitBtn.innerText = "Odosielam...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("/", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(formData).toString(),
                });

                if (response.ok) {
                  
                    bookingForm.innerHTML = `
                        <div class="text-center py-8 space-y-4 animate-bounce">
                            <div class="text-5xl">🌸</div>
                            <h3 class="text-2xl text-rose-800 font-serif">Ďakujem!</h3>
                            <p class="text-slate-600">Vaša rezervácia bola odoslaná. Dula sa vám čoskoro ozve.</p>
                        </div>
                    `;
                } else {
                    throw new Error("Chyba pri odosielaní");
                }
            } catch (error) {
                alert("Ups, niečo sa nepodarilo. Skúste to prosím neskôr alebo napíšte email.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});

// 4. GOOGLE CALENDAR FETCH (Náčrt pre C++ dev-a)
/*
   Pre automatizáciu by si musel:
   1. V Google Cloud Console vytvoriť API Key.
   2. Použiť fetch: 
      https://www.googleapis.com/calendar/v3/calendars/{CAL_ID}/events?key={API_KEY}&timeMin={NOW}
   3. Výsledok (JSON) namapovať na pole 'occupiedDates'.
   
   Pre začiatok však klientke stačí, ak tie "obsadené" dátumy 
   manuálne raz za čas hodíš do kódu, alebo ich necháš vybrať a dula 
   termín zamietne emailom (najjednoduchšie MVP).
*/