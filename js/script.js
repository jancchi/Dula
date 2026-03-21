/**
 * Dula Project - Main JS
 * 
 */
const API_KEY="AIzaSyBdyFGCnt4I_NcxIhHU7wjAFRN8LrmoOn8";
const CALENDAR_ID="90602a0b6bda9b6f7c3b5a00b58cd39c8cfd488e629167149f8547483137ae7f@group.calendar.google.com";

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
                alert("Ups, niečo sa nepodarilo. Skúste to prosím neskôr alebo napíšte email. error: " + error);
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }


 const calendarEl = document.getElementById('calendar');
if(calendarEl){
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek',
    googleCalendarApiKey: API_KEY,
    selectOverlap: false,

    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    events: {
      googleCalendarId: CALENDAR_ID,
      display: 'background',
      color: '#ff9f89'
    },

    locale: "sk",

    firstDay: 1, 
    validRange: {
        start: new Date() // Users cannot select or navigate before today
    },

    slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
    },

    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },

    slotMinTime: '8:00:00',
    slotMaxTime: '21:00:00', 
    slotDuration: '00:30:00',

    selectable: true,
    allDaySlot: false,

    eventDataTransform: function(eventData) {
        return {
            ...eventData,
            overlap: false,       // Explicitne povieme, že cez toto sa nedá ísť
            display: 'background' // Vynútime background štýl
        };
    },

    slotLabelContent: (arg) => {
        return {
            html: `<div class="text-xl font-light text-rose-300">${arg.text}</div>`
        };
    },

    select: function(info) {
        const startDate = new Date(info.start);
        const options = { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        };
        const formattedDate = startDate.toLocaleString('sk-SK', options);

        const input = document.getElementById("date_input");
        if (input) {
            input.value = formattedDate;
            
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            input.classList.add('ring-2', 'ring-rose-400');
            setTimeout(() => input.classList.remove('ring-2', 'ring-rose-400'), 1000);
        }
    }
  });

  calendar.render();
}
});


