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

const API_KEY="AIzaSyBdyFGCnt4I_NcxIhHU7wjAFRN8LrmoOn8";
const CALENDAR_ID="90602a0b6bda9b6f7c3b5a00b58cd39c8cfd488e629167149f8547483137ae7f@group.calendar.google.com";

import { Calendar } from '@fullcalendar/core';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const calendarEl = document.getElementById('calendar');
const calendar = new Calendar(calendarEl, {
  plugins: [timeGridPlugin, googleCalendarPlugin, interactionPlugin],
  initialView: 'timeGridDay', // Google-style day view
  googleCalendarApiKey: API_KEY,
  events: {
    googleCalendarId: CALENDAR_ID,
    display: 'background', // Shows busy times as background blocks
    color: '#ff9f89'       // Reddish color for busy slots
  },
  
  // 1. Define your available booking window (10 PM to 6 AM)
  businessHours: {
    startTime: '22:00',
    endTime: '06:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // Every day
  },

  // 2. Force selections to stay within those business hours
  selectable: true,
  selectConstraint: 'businessHours', 
  
  // 3. UI: Hide the 6 AM - 10 PM gap completely from view
  slotMinTime: '22:00:00',
  slotMaxTime: '06:00:00',

  select: function(info) {
    // This triggers when a user clicks an hour
    alert('Selected from ' + info.startStr + ' to ' + info.endStr);
    // Open your contact form here
  }
});

calendar.render();

document.addEventListener('DOMContentLoaded', () => {
    
//alert(calendarEl.className);
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

    //document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));



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
            enableTime: true,
            minDate: "today",
            disable: occupiedDates, 
            dateFormat: "Y-m-d H:m",
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